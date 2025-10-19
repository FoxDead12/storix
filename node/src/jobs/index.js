import Login from "./auth/login.js"
import Register from "./auth/register.js"
import FoldersOps from "./folders/folders-ops.js"
import FilesOps from './files/files-ops.js'
import Session from "./auth/session.js"

export default {
  'login': Login,
  'register': Register,
  'folders-ops': FoldersOps,
  'file-ops': FilesOps,
  'session': Session
}
