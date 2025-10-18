import Job from "../../classes/job.js";

export default class FoldersOps extends Job {

  async perform (job) {

    this.job = job;

    switch (this.req.method) {
      case 'GET':
        await this.fetch_folders();
        break;
      case 'POST':
        await this.create_folder();
        break;
      case 'PATCH':
        await this.update_folder();
        break;
      case 'DELETE':
        await this.delete_folder();
        break;
      default:
        return this.reportError({status: 405, message: "Method Not Allowed"});
    }

  }

  async fetch_folders () {
    const match = this.req.url.match(/^\/folders\/(\d+)/);
    let folders = null;

    if (match && match[1]) {
      const id = match[1];
      folders = await this.db.query(`SELECT id, description, parent_id, user_defined FROM ${this.job.user_schema}.folders WHERE id = $1`, [id]);
      folders = folders.rows[0];
    } else {
      // TODO, AVALIATE THIS CODE, AND PASS TO A METHOD OF A CLASS
      folders = [];
      var filter = [];
      let { page, sort } = this.job.params;

      if (page == null || page == '' || page == 0) {
        page = 1;
      }

      if (sort == null || sort == '' || sort == 0) {
        sort = 'created_at';
      }

      folders = await this.db.query(`SELECT id, description, parent_id, user_defined FROM ${this.job.user_schema}.folders ORDER BY $3 DESC LIMIT $1 OFFSET $2`, [page * 100, (page - 1) * 100, sort]);
      folders = folders.rows;
    }

    return this.sendResponse({response: folders});
  }

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

  async delete_folder () {
    const match = this.req.url.match(/^\/folders\/(\d+)/);
    if (!match || !match[1]) {
      return this.reportError({ message: "Need indicate the item wuant delete in url"});
    }
    const id = match[1];
    await this.db.query(`DELETE FROM ${this.job.user_schema}.folders WHERE id = $1 AND user_defined = true`, [id]);
    return this.sendResponse({message: 'Folder successfully deleted'});
  }

}
