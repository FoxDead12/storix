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

    let queryProps = {
      table: 'files',
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
      limit: 20
    }

    if ( this.job.params.hasOwnProperty('filter[p_photos]') ) {
      // ... show only fotos and videos ...
      queryProps.filters.push("type IN ('image', 'video')");

    } else {
      // ... show from directory ...
    }

    if ( this.job.params.hasOwnProperty('page') && Number(this.job.params['page']) > 1 ) {
      queryProps.offset = queryProps.limit * this.job.params['page'];
    }

    const query = `
      SELECT ${queryProps.attributes.join(',')} FROM ${this.job.user_schema}.${queryProps.table}
      ${queryProps.filters.length > 0 ? `WHERE ${queryProps.filters.join(' AND ')}` : ''}
      ORDER BY ${queryProps.order_by}
      OFFSET ${queryProps.offset}
      LIMIT ${queryProps.limit}
    `;

    const files = await this.db.query(query, []);
    return this.sendResponse({ response: files.rows });
  }

//   async get_files () {
//
//     if ( this.job.params.hasOwnProperty('mode') ) {
//       const mode = this.job.params['mode'];
//       if ( mode == 'photos' ) {
//         return await this._photos_mode();
//       } else if ( mode == 'files' ) {
//         return await this._files_mode();
//       }
//     }
//
//     return this.reportError({status: 404, message: "Need indicate mode in url"});
//
//
//
//
//
//     const { page, photos } = this.job.params;
//     let filter = [];
//
//     // ... set default values of filters ...
//     if ( !page || page == 0 ) {
//       page = 1;
//     }
//
//     const offset = (page - 1) * 100;
//     if (photos) {
//       filter.push(`(extension IN ('gif', 'png', 'jpeg', 'jpg', 'bmp', 'tiff', 'ico', 'heic', 'webp'))`);
//     }
//
//     const query = `
//       SELECT
//         uuid,
//         description,
//         extension,
//         size,
//         birthtime,
//         folder_id
//       FROM ${this.job.user_schema}.files
//       WHERE ${filter.join(' AND ')}
//       ORDER BY birthtime
//       OFFSET $1
//       LIMIT 100
//     `;
//     const files = await this.db.query(query, [offset]);
//     return this.sendResponse({response: files.rows});
//
//   }
//
//   async _photos_mode () {
//
//     if ( this.job.params.hasOwnProperty('count') ) {
//       // ... get total numb of items in db ...
//       const count = await this.db.query( `SELECT COUNT(id) FROM ${this.job.user_schema}.files WHERE extension IN ('gif', 'png', 'jpeg', 'jpg', 'bmp', 'tiff', 'ico', 'heic', 'webp')`, [] );
//       return this.sendResponse({response: count.rows[0]});
//     } else {
//       // ... get items for page ...
//       let page = Number(this.job.params);
//       if ( !page || page <= 0) {
//         page = 1;
//       }
//       const offset = (page - 1) * 100;
//       const files = await this.db.query(
//         `SELECT uuid, description, extension, size, birthtime, folder_id FROM ${this.job.user_schema}.files WHERE extension IN ('gif', 'png', 'jpeg', 'jpg', 'bmp', 'tiff', 'ico', 'heic', 'webp') ORDER BY birthtime, create_at OFFSET $1 LIMIT 100`,
//         [offset]
//       );
//       return this.sendResponse({response: files.rows});
//     }
//
//   }
//
//   async _files_mode () {
//
//   }

}
