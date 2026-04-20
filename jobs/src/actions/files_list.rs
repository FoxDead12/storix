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
    page: String,
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

        println!("params: {:?}", job.params);

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

        // ... convert string param to integer ...
        let page_number: i64 = match params.page.parse::<i64>() {
            Ok(n) => if n < 1 { 1 } else { n },
            Err(e) => {
                let msg = format!("Invalid JSON payload: {}", e);
                return self.error_response(&mut job, &msg, Some("PAYLOAD_MISMATCH"), None, None);
            }
        };

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
        let mut query_filters: Vec<&str> = Vec::new();
        let query_order_by = "birthtime DESC, create_at DESC";
        let query_offset = 0;
        let query_limit = 100;

        query_filters.push("type IN ('image', 'video')");

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
            query_filters.join(" AND "),
            query_order_by,
            query_offset,
            query_limit
        );

        let rows = match job.postgres.query(&query, &[]) {
            Ok(rows) => rows,
            Err(e) => {
                brook_http_worker::logger::log("ERROR", e.to_string().as_str());
                return self.exception_response(&mut job, "Internal server error", Some("DATABASE_ERROR"), None, None);
            }
        };

        let mut files_list: Vec<Value> = Vec::new();

        for row in rows {
            let mut row_map = Map::new();

            // Iteramos sobre os nomes das colunas que definiu no array
            for (i, col_full_name) in query_attributes.iter().enumerate() {

                // Lógica para limpar o nome da chave no JSON:
                // Se a coluna for "to_char(...) as birthtime_date", queremos apenas "birthtime_date"
                let json_key = col_full_name
                    .split(" as ")
                    .last()
                    .unwrap_or(col_full_name)
                    .trim();

                // Extrair o valor da coluna.
                // Nota: O Rust precisa saber o tipo. Se as colunas variarem,
                // o mais seguro é tentar extrair como Value (se o driver suportar)
                // ou tipos comuns como String, i32, etc.
                let value: Option<String> = row.try_get(i).unwrap_or(None);

                row_map.insert(json_key.to_string(), json!(value));
            }

            // Adiciona o objeto (linha) ao array principal
            files_list.push(Value::Object(row_map));
        }

        self.success_response(&mut job, "List off files", None, Some(serde_json::json!(files_list)), None);


    }

}
