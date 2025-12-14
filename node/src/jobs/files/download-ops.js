import Job from "../../classes/job.js";
import path from 'path';
import archiver from "archiver";
import crypto from "crypto";
import os from "os";
import fs from "fs/promises";

export default class DownloadOps extends Job {

  async perform (job) {

    this.job = job;

    switch ( this.req.method ) {
      case 'POST':
        await this.download_zip();
        break;
      default:
        return this.reportError({status: 405, message: 'Method Not Allowed'});
    }

  }

  // ... method will create a temporary zip to send to client ...
  async download_zip () {

    // ... parse body from request ...
    this.job.body = await this._parse_body(this.req);

    // ... get items to download ...
    const uuids = this.job?.body?.items;
    if ( !uuids || uuids.length == 0 ) {
      return this.reportError({status: 400, message: 'Need indicate at least 1 item to download'});
    }

    // ... safe check to dont create a big .zip file ...
    if ( uuids.length > 20 ) {
      return this.reportError({status: 400, message: 'The max files to download at same time is 20'});
    }

    // ... get items from database ...
    const query = `SELECT path, description FROM ${this.job.user_schema}.files WHERE uuid = ANY($1::text[])`;

    // ... get only paths from db ...
    let paths = await this.db.query(query, [uuids]);
    paths = paths.rows;

    // ... create absolute path ...
    for ( let p of paths ) {
      p.path = path.join(this.config.upload_dir, p.path);
    }

    // ... set header to force browsers download ...
    this.res.setHeader("Content-Type", "application/zip");
    this.res.setHeader("Content-Disposition", 'attachment; filename="download.zip"');

    // ... create archive with no compression ...
    const archive = archiver("zip", { zlib: { level: 0 } });

    // ... error handler ...
    archive.on("error", err => { console.error(err) });

    // ... stream to http ...
    archive.pipe(this.res);

    // ... set files to compress ...
    for ( let p of paths ) {
      archive.file(p.path, { name: p.description });
    }

    await archive.finalize();

    this.res.on("close", () => {
      fs.rm(tmp_dir, { recursive: true, force: true }, () => {});
    });

  }

  async _parse_body (req) {
    return await new Promise((res, rej) => {
      const body = [];
      req
        .on('data', chunk => body.push(chunk))
        .on('end', () => {
          try {
            res(JSON.parse(Buffer.concat(body).toString()))
          } catch (e) {
            rej(HTTPError('Invalid body of json', 400));
          }
        })
        .on('error', err => rej(err))
    });
  }

}
