import Login from "./auth/login.js"
import Register from "./auth/register.js"
import FoldersOps from "./folders/folders-ops.js"
import FsOps from './files/fs-ops.js'
import FileOps from "./files/files-ops.js"
import Session from "./auth/session.js"
import DownloadOps from "./files/download-ops.js"
import RefreshToken from "./auth/refreshToken.js"
import ShareOps from "./files/share-ops.js"

export default {
  'login': Login,
  'register': Register,
  'folders-ops': FoldersOps,
  'fs-ops': FsOps,
  'files-ops': FileOps,
  'session': Session,
  'download-ops': DownloadOps,
  'refresh-token': RefreshToken,
  'share-ops': ShareOps
}
