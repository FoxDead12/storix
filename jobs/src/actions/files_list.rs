use brook_http_worker::worker::job::JobAbstract;
use serde::{ Deserialize, Serialize };
use serde_json::{json, Value, Map};

pub struct FilesList;

#[derive(Deserialize, Debug)]
struct SessionPayload {
  schema: String
}

#[derive(Deserialize, Debug)]
struct ParamsPayload {
    #[serde(rename = "filter[p_photos]")]
    p_photos: Option<String>,
    #[serde(rename = "filter[p_files]")]
    p_files: Option<String>,
    page: Option<String>,
    aggregate: Option<String>,
}

impl JobAbstract for FilesList {

    fn perform(&self, mut job: brook_http_worker::worker::job::Job) {

        // ... check if session json is valid ...
        let session: SessionPayload = match &job.session {
            Some(raw) => {
                match serde_json::from_value::<SessionPayload>(raw.clone()) {
                    Ok(p) => p,
                    Err(e) => {
                            brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                        return self.exception_response(&mut job, "Internal server error", Some("PAYLOAD_MISMATCH"), None, None);
                    }
                }
            }
            None => return self.exception_response(&mut job, "Internal server error", Some("MISSING_PAYLOAD"), None, None)
        };

        let params: ParamsPayload = match &job.params {
            Some(raw) => match serde_json::from_value::<ParamsPayload>(raw.clone()) {
                Ok(p) => p,
                Err(e) => {
                    brook_http_worker::logger::log("ERROR", format!("Params mismatch: {}", e).as_str());
                    return self.exception_response(&mut job, "Invalid parameters structure", Some("PARAMS_MISMATCH"), None, None);
                }
            },
            None => return self.exception_response(&mut job, "Parameters are required", Some("MISSING_PARAMS"), None, None)
        };

        // ... return per-year photo counts for the gallery's year scrubber ...
        if params.aggregate.as_deref() == Some("years") {
            return self.get_year_counts(&mut job, &session.schema);
        }

        // ... convert string param to integer ...
        let page_number: i64 = match params.page.as_deref().unwrap_or("1").parse::<i64>() {
            Ok(n) => if n < 1 { 1 } else { n },
            Err(e) => {
                let msg = format!("Invalid JSON payload: {}", e);
                return self.error_response(&mut job, &msg, Some("PAYLOAD_MISMATCH"), None, None);
            }
        };

        // ... filter clause ...
        let filter_clause = match (&params.p_photos, &params.p_files) {
            (Some(p), None) if p == "true" => "type IN ('image', 'video')",
            (None, Some(f)) if f == "true" => "type NOT IN ('image', 'video')",
            (Some(_), Some(_)) => {
                return self.error_response(&mut job, "Send only one filter: p_photos or p_files", Some("AMBIGUOUS_FILTER"), None, None);
            },
            _ => {
                return self.error_response(&mut job, "Parameters are required", Some("MISSING_PARAMS"), None, None);
            }
        };

        // ... params to query ...
        let query_attributes: [&str; 7] = [
            "uuid",
            "description",
            "extension",
            "size",
            "to_char(birthtime, 'YYYY-MM-DD') as birthtime_date",
            "folder_id",
            "type"
        ];
        let query_table = "files";
        let query_filters = filter_clause;
        let query_order_by = "birthtime DESC, create_at DESC";
        let query_limit = 100;
        let mut query_offset = 0;

        // ... only allow page if param is biger than 1 ...
        if (page_number > 1) {
            query_offset = query_limit * (page_number - 1);
        }

        // ... build query struct ...
        let query = format!("
            SELECT {}
            FROM {}.{}
            WHERE {}
            ORDER BY {}
            OFFSET {}
            LIMIT {}
        ",
            query_attributes.join(","),
            session.schema,
            query_table,
            query_filters,
            query_order_by,
            query_offset,
            query_limit
        );

        // ... execute query ...
        let rows = match job.postgres.query(&query, &[]) {
            Ok(rows) => rows,
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(&mut job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        // ... create list of files to send to front end ...
        let mut files_list: Vec<Value> = Vec::new();

        // ... create new file struct ...
        for row in rows {
            let mut row_map = Map::new();
            for (i, col_full_name) in query_attributes.iter().enumerate() {
                let json_key = col_full_name
                    .split(" as ")
                    .last()
                    .unwrap_or(col_full_name)
                    .trim();

                let value: Option<String> = row.try_get(i).unwrap_or(None);
                row_map.insert(json_key.to_string(), json!(value));
            }
            files_list.push(Value::Object(row_map));
        }

        self.success_response(&mut job, "Files list", None, Some(serde_json::json!(files_list)), None);

    }

}

impl FilesList {

    // ... returns per-year AND per-month photo counts in a single query, used by the
    // gallery's year+month scrubber. Shape: [{ year, count, months: [{ month, count }, ...] }, ...],
    // years and months both ordered DESC (newest first), months nested under their year ...
    fn get_year_counts (&self, job: &mut brook_http_worker::worker::job::Job, schema: &str) {

        let query = format!("
            SELECT to_char(birthtime, 'YYYY') AS year, to_char(birthtime, 'MM') AS month, COUNT(*)::text AS count
            FROM {}.files
            WHERE type IN ('image', 'video')
            GROUP BY 1, 2
            ORDER BY 1 DESC, 2 DESC
        ", schema);

        let rows = match job.postgres.query(&query, &[]) {
            Ok(rows) => rows,
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        struct YearBucket { year: String, count: i64, months: Vec<Value> }
        let mut buckets: Vec<YearBucket> = Vec::new();

        for row in rows {
            let year: Option<String> = row.try_get(0).unwrap_or(None);
            let month: Option<String> = row.try_get(1).unwrap_or(None);
            let count_raw: Option<String> = row.try_get(2).unwrap_or(None);

            let year = year.unwrap_or_default();
            let month = month.unwrap_or_default();
            let count: i64 = count_raw.and_then(|c| c.parse::<i64>().ok()).unwrap_or(0);

            match buckets.last_mut() {
                Some(bucket) if bucket.year == year => {
                    bucket.count += count;
                    bucket.months.push(json!({ "month": month, "count": count }));
                }
                _ => {
                    buckets.push(YearBucket {
                        year,
                        count,
                        months: vec![json!({ "month": month, "count": count })]
                    });
                }
            }
        }

        let year_counts: Vec<Value> = buckets.into_iter()
            .map(|b| json!({ "year": b.year, "count": b.count, "months": b.months }))
            .collect();

        self.success_response(job, "Photo year counts", None, Some(serde_json::json!(year_counts)), None);

    }

}
