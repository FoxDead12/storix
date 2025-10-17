import Job from "../../classes/job.js";

export default class FoldersOps extends Job {

  async perform (job) {

    this.job = job;

    switch (this.req.method) {
      case 'GET': break;
      case 'POST':
        await this.create_folder();
        break;
      case 'PATCH':
        await this.update_folder();
        break;
      default:
        return this.reportError({status: 405, message: "Method Not Allowed"});
    }

  }

  async fetch_folders () {}

  async create_folder () {
    const { description, parent_id } = this.job.body;
    const folder = await this.db.query(`INSERT INTO ${this.job.user_schema}.folders (description, parent_id) VALUES ($1, $2) RETURNING id, description, parent_id`, [description, parent_id]);
    return this.sendResponse({message: 'Folder successfully created', response: folder.rows[0]});
  }

  async update_folder () {

    const match = this.req.url.match(/^\/folders\/(\d+)/);
    if (!match || !match[1]) {
      return this.reportError({ message: "Need indicate the item wuant update in url"});
    }
    const id = match[1];
    const { description, parent_id } = this.job.body;
    const folder = await this.db.query(`UPDATE ${this.job.user_schema}.folders SET description = $1, parent_id = $2 WHERE id = $3 RETURNING id, description, parent_id`, [description, parent_id, id]);
    return this.sendResponse({message: 'Folder successfully updated', response: folder.rows[0]});
  }

  async delete_folder () {}

}
