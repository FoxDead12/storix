use brook_http_worker::worker::worker::Worker;
use jobs::auth::{login::LoginJob, register::RegisterJob};

/**
 * Worker in rust, will handle jobs comming from beanstalkd
 * For now will only handle autorization and session jobs
 */

fn main() {
    let mut w = Worker::new();

    // ... tubes of worker ...
    w.add_job("storix-login", LoginJob);
    w.add_job("storix-register", RegisterJob);

    w.start();
}
