import Job from "../../classes/job.js"

export default class FileOps extends Job {

  async perform (job) {
    this.job = job;

    switch (this.req.method) {
      case 'GET':
        await this.get_files_records();
        break;
      default:
        return this.reportError({status: 405, message: "Method Not Allowed"});
    }

  }

  async get_files_records () {

    const { page, photos } = this.job.params;
    let filter = [];

    // ... set default values of filters ...
    if ( !page || page == 0 ) {
      page = 1;
    }

    const offset = (page - 1) * 100;
    if (photos) {
      filter.push(`(extension IN ('gif', 'png', 'jpeg', 'jpg', 'bmp', 'tiff', 'ico', 'heic', 'webp'))`);
    }

    const query = `
      SELECT
        uuid,
        description,
        extension,
        size,
        birthtime,
        folder_id
      FROM ${this.job.user_schema}.files
      WHERE ${filter.join(' AND ')}
      ORDER BY birthtime
      OFFSET $1
      LIMIT 100
    `;
    const files = await this.db.query(query, [offset]);
    return this.sendResponse({response: files.rows});

  }
}
