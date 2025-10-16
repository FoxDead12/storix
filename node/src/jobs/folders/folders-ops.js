import Job from "../../classes/job.js";

export default class FoldersOps extends Job {

  async perform (job) {

    this.job = job;

    switch (this.req.method) {
      case 'GET': break;
      case 'POST':
        await this.create_folder();
        break;
      case 'PATCH': break;
      default:
        return this.reportError({status: 405, message: "Method Not Allowed"});
    }

  }

  async fetch_folders () {}

  async create_folder () {
    const { description, parent_id } = this.job.body;
    const folder = await this.db.query(`INSERT INTO ${this.job.user_schema}.folders (description, parent_id) VALUES ($1, $2)`, [description, parent_id]);
    return this.sendResponse({message: 'Folder successfully created', response: folder.rows[0]});
  }

  async update_folder () {}
  async delete_folder () {}

}
