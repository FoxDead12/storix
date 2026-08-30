use brook_http_worker::worker::worker::Worker;
use jobs::{
    actions::{files_list::FilesList, user_session::UserSession, folders_ops::FoldersOps, share_ops::ShareOps},
    auth::{login::LoginJob, register::RegisterJob, refresh_token::RefreshTokenJob},
    files::{upload::Upload, download::Download, download_zip::DownloadZip, delete::Delete}
};

/**
 * Worker in rust, will handle jobs comming from beanstalkd.
 * Covers every route the Node.js broker/fs servers used to handle.
 */

fn main() {
    dotenvy::dotenv().ok();

    let mut worker = Worker::new();

    // ... tubes of worker ...
    worker.add_job("storix-login", LoginJob);
    worker.add_job("storix-register", RegisterJob);
    worker.add_job("storix-refresh-token", RefreshTokenJob);

    worker.add_job("storix-user-session", UserSession);
    worker.add_job("storix-files-list", FilesList);
    worker.add_job("storix-upload", Upload);
    worker.add_job("storix-download", Download);
    worker.add_job("storix-download-zip", DownloadZip);
    worker.add_job("storix-file-delete", Delete);
    worker.add_job("storix-folders-ops", FoldersOps);
    worker.add_job("storix-share-ops", ShareOps);

    worker.start();
}
