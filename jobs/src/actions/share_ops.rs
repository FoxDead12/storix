use brook_http_worker::worker::job::JobAbstract;

pub struct ShareOps;

// ... ported as a stub: the original Node implementation (share-ops.js) only logged the job and
// never generated a real share token, so there is no behavior to replicate yet. This tube exists
// so it can be wired up once the actual share-link feature is designed ...
impl JobAbstract for ShareOps {

    fn perform(&self, mut job: brook_http_worker::worker::job::Job) {
        self.error_response(&mut job, "Sharing is not implemented yet", Some("NOT_IMPLEMENTED"), None, None);
    }

}
