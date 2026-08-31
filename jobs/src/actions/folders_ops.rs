use brook_http_worker::worker::job::JobAbstract;
use serde::{Deserialize, Serialize};
use serde_json::Value;

pub struct FoldersOps;

#[derive(Deserialize, Debug)]
struct SessionPayload {
    schema: String
}

#[derive(Deserialize, Debug)]
struct ParamsPayload {
    id: Option<String>,
    page: Option<String>,
    sort: Option<String>,
}

#[derive(Deserialize, Debug)]
struct FolderMutationPayload {
    description: String,
    parent_id: Option<i32>,
}

// ... row shape used when listing / fetching a single folder ...
#[derive(Serialize)]
struct FolderRecord {
    id: i32,
    description: String,
    parent_id: Option<i32>,
    user_defined: bool,
}

// ... row shape returned right after a create/update, mirrors the Node RETURNING clause ...
#[derive(Serialize)]
struct FolderMutationRecord {
    id: i32,
    description: String,
    parent_id: Option<i32>,
}

// ... only these columns may be used to sort the folder list, avoids building a query with an
// arbitrary/unsafe identifier straight from client input ...
const ALLOWED_SORT_COLUMNS: [&str; 3] = ["id", "description", "create_at"];

impl JobAbstract for FoldersOps {

    fn perform(&self, mut job: brook_http_worker::worker::job::Job) {

        let session: SessionPayload = match &job.session {
            Some(raw) => match serde_json::from_value::<SessionPayload>(raw.clone()) {
                Ok(p) => p,
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                    return self.exception_response(&mut job, "Internal server error", Some("PAYLOAD_MISMATCH"), None, None);
                }
            },
            None => return self.exception_response(&mut job, "Internal server error", Some("MISSING_PAYLOAD"), None, None)
        };

        let params: ParamsPayload = match &job.params {
            Some(raw) => match serde_json::from_value::<ParamsPayload>(raw.clone()) {
                Ok(p) => p,
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                    return self.error_response(&mut job, "Invalid parameters structure", Some("PARAMS_MISMATCH"), None, None);
                }
            },
            None => ParamsPayload { id: None, page: None, sort: None }
        };

        match job.method.as_str() {
            "GET" => self.fetch_folders(&mut job, &session.schema, &params),
            "POST" => self.create_folder(&mut job, &session.schema),
            "PATCH" => self.update_folder(&mut job, &session.schema, &params),
            "DELETE" => self.delete_folder(&mut job, &session.schema, &params),
            _ => self.error_response(&mut job, "Method Not Allowed", Some("METHOD_NOT_ALLOWED"), None, None)
        }

    }

}

impl FoldersOps {

    fn fetch_folders (&self, job: &mut brook_http_worker::worker::job::Job, schema: &str, params: &ParamsPayload) {

        // ... fetch a single folder by id ...
        if let Some(id_raw) = &params.id {
            let id: i32 = match id_raw.parse::<i32>() {
                Ok(id) => id,
                Err(_) => return self.error_response(job, "Invalid folder id", Some("INVALID_ID"), None, None)
            };

            let query = format!("SELECT id, description, parent_id, user_defined FROM {}.folders WHERE id = $1", schema);
            let row = match job.postgres.query_opt(&query, &[&id]) {
                Ok(Some(row)) => row,
                Ok(None) => return self.error_response(job, "Folder don't exist", Some("NOT_FOUND"), None, None),
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                    return self.exception_response(job, "Internal server error", Some("DATABASE_ERROR"), None, None);
                }
            };

            let record = FolderRecord {
                id: row.get("id"),
                description: row.get("description"),
                parent_id: row.get("parent_id"),
                user_defined: row.get("user_defined"),
            };

            return self.success_response(job, "Folder", None, Some(serde_json::json!(record)), None);
        }

        // ... otherwise list all folders, paginated ...
        let page_number: i64 = match params.page.as_deref().unwrap_or("1").parse::<i64>() {
            Ok(n) if n >= 1 => n,
            _ => 1
        };

        let sort_column = params.sort.as_deref()
            .filter(|s| ALLOWED_SORT_COLUMNS.contains(s))
            .unwrap_or("create_at");

        let query_limit: i64 = 100;
        let query_offset = query_limit * (page_number - 1);

        let query = format!("
            SELECT id, description, parent_id, user_defined
            FROM {}.folders
            ORDER BY {} DESC
            OFFSET {}
            LIMIT {}
        ", schema, sort_column, query_offset, query_limit);

        let rows = match job.postgres.query(&query, &[]) {
            Ok(rows) => rows,
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        let folders: Vec<Value> = rows.iter().map(|row| {
            serde_json::json!(FolderRecord {
                id: row.get("id"),
                description: row.get("description"),
                parent_id: row.get("parent_id"),
                user_defined: row.get("user_defined"),
            })
        }).collect();

        self.success_response(job, "Folders list", None, Some(serde_json::json!(folders)), None);
    }

    fn create_folder (&self, job: &mut brook_http_worker::worker::job::Job, schema: &str) {

        let payload: FolderMutationPayload = match &job.payload {
            Some(raw) => match serde_json::from_value::<FolderMutationPayload>(raw.clone()) {
                Ok(p) => p,
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                    return self.error_response(job, "Invalid payload structure", Some("PAYLOAD_MISMATCH"), None, None);
                }
            },
            None => return self.error_response(job, "Is necessary indicate the folder description", Some("MISSING_PAYLOAD"), None, None)
        };

        let query = format!("
            INSERT INTO {}.folders (description, parent_id)
            VALUES ($1, $2)
            RETURNING id, description, parent_id
        ", schema);

        let row = match job.postgres.query_one(&query, &[&payload.description, &payload.parent_id]) {
            Ok(row) => row,
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        let record = FolderMutationRecord {
            id: row.get("id"),
            description: row.get("description"),
            parent_id: row.get("parent_id"),
        };

        self.success_response(job, "Folder successfully created", None, Some(serde_json::json!(record)), None);
    }

    fn update_folder (&self, job: &mut brook_http_worker::worker::job::Job, schema: &str, params: &ParamsPayload) {

        let id: i32 = match params.id.as_deref().and_then(|v| v.parse::<i32>().ok()) {
            Some(id) => id,
            None => return self.error_response(job, "Need indicate the item want update", Some("MISSING_ID"), None, None)
        };

        let payload: FolderMutationPayload = match &job.payload {
            Some(raw) => match serde_json::from_value::<FolderMutationPayload>(raw.clone()) {
                Ok(p) => p,
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                    return self.error_response(job, "Invalid payload structure", Some("PAYLOAD_MISMATCH"), None, None);
                }
            },
            None => return self.error_response(job, "Is necessary indicate the folder description", Some("MISSING_PAYLOAD"), None, None)
        };

        let query = format!("
            UPDATE {}.folders
            SET description = $1, parent_id = $2
            WHERE id = $3
            RETURNING id, description, parent_id
        ", schema);

        let row = match job.postgres.query_opt(&query, &[&payload.description, &payload.parent_id, &id]) {
            Ok(Some(row)) => row,
            Ok(None) => return self.error_response(job, "Folder don't exist", Some("NOT_FOUND"), None, None),
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        let record = FolderMutationRecord {
            id: row.get("id"),
            description: row.get("description"),
            parent_id: row.get("parent_id"),
        };

        self.success_response(job, "Folder successfully updated", None, Some(serde_json::json!(record)), None);
    }

    fn delete_folder (&self, job: &mut brook_http_worker::worker::job::Job, schema: &str, params: &ParamsPayload) {

        let id: i32 = match params.id.as_deref().and_then(|v| v.parse::<i32>().ok()) {
            Some(id) => id,
            None => return self.error_response(job, "Need indicate the item want delete", Some("MISSING_ID"), None, None)
        };

        // ... the system/root folder (id = 0) is never user_defined, so this also protects it ...
        let query = format!("DELETE FROM {}.folders WHERE id = $1 AND user_defined = true", schema);

        let affected = match job.postgres.execute(&query, &[&id]) {
            Ok(count) => count,
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        if affected == 0 {
            return self.error_response(job, "Folder don't exist or can't be deleted", Some("NOT_FOUND"), None, None);
        }

        self.success_response(job, "Folder successfully deleted", None, None, None);
    }

}
