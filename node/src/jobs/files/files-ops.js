import Job from "../../classes/job.js"

export default class FileOps extends Job {

  async perform (job) {
    this.job = job;

    switch (this.req.method) {
      case 'GET': await this.get(); break;
      default: return this.reportError({status: 405, message: "Method Not Allowed"});
    }

  }

  async get () {

    // ... object to generate query ...
    let queryProps = {
      table: 'files',
      join: '',
      attributes: [
        'uuid',
        'description',
        'extension',
        'size',
        "to_char(birthtime, 'YYYY-MM-DD') as birthtime_date",
        'folder_id',
        'type'
      ],
      filters: new Array(),
      order_by: 'birthtime DESC, create_at DESC',
      offset: 0,
      limit: 100
    }

    if ( this.job.params.hasOwnProperty('filter[p_photos]') ) {
      // ... show only fotos and videos ...
      queryProps.filters.push("type IN ('image', 'video')");

    } else if ( this.job.params.hasOwnProperty('filter[p_files]') ) {
      // ... show from directory ...
      queryProps.filters.push("type = 'file'");
      queryProps.join = ''
    }

    if ( this.job.params.hasOwnProperty('page') && Number(this.job.params['page']) > 1 ) {
      queryProps.offset = queryProps.limit * (this.job.params['page'] - 1);
    }

    const query = `
      SELECT ${queryProps.attributes.join(',')} FROM ${this.job.user_schema}.${queryProps.table}
      ${queryProps.join}
      ${queryProps.filters.length > 0 ? `WHERE ${queryProps.filters.join(' AND ')}` : ''}
      ORDER BY ${queryProps.order_by}
      OFFSET ${queryProps.offset}
      LIMIT ${queryProps.limit}
    `;

    const files = await this.db.query(query, []);
    return this.sendResponse({ message: 'File deleted successfully', response: files.rows });
  }

}
