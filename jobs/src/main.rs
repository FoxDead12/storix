use brook_http_worker::worker::worker::Worker;
use jobs::{actions::user_session::UserSession, auth::{login::LoginJob, register::RegisterJob}};

/**
 * Worker in rust, will handle jobs comming from beanstalkd
 * For now will only handle autorization and session jobs
 */

fn main() {
    let mut worker = Worker::new();

    // ... tubes of worker ...
    worker.add_job("storix-login", LoginJob);
    worker.add_job("storix-register", RegisterJob);

    worker.add_job("storix-user-session", UserSession);

    worker.start();
}
