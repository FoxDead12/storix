import Job from "../../classes/job.js";
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { promises as fsp } from 'fs';
import { fileTypeFromFile } from "file-type";

export default class FilesOps extends Job {

  static mime_types = {
    pdf: 'application/pdf',
    txt: 'text/plain',
    html: 'text/html',
    exe: 'application/octet-stream',
    zip: 'application/zip',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    gif: 'image/gif',
    png: 'image/png',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    php: 'text/plain',
    mp4: 'video/mp4',
    mov: 'video/quicktime',            // usado por iPhone
    m4v: 'video/x-m4v',                // iOS
    m4a: 'audio/m4a',                   // áudio iOS
    aac: 'audio/aac',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
    bmp: 'image/bmp',
    tiff: 'image/tiff',
    ico: 'image/x-icon',
    heic: 'image/heic',                 // formato iPhone moderno
    webp: 'image/webp'
  };



  async perform (job) {
    this.job = job;

    switch (this.req.method) {
      case 'GET':
        await this.get_file();
        break;
      case 'POST':
        await this.upload_file();
        break;
      default:
        return this.reportError({status: 405, message: "Method Not Allowed"});
    }

  }

  async get_file () {

    // ... get uuid from url ...
    const match = this.req.url.match(/^\/files\/([A-Za-z0-9-]+)/);
    if (!match || !match[1]) {
      return this.reportError({ message: "Need indicate the item wuant get in url"});
    }
    const uuid = match[1];

    // ... get file from db ...
    let file = await this.db.query(
      `SELECT id, path, description, extension FROM ${this.job.user_schema}.files WHERE uuid = $1`,
      [uuid]
    );

    // ... validate if file exist ...
    if (file.rows.length == 0) {
      return this.reportError({ message: "Don't exist a file width this uuid"});
    } else {
      file = file.rows[0];
    }
    const file_path = path.join(this.config.upload_dir, file.path);

    // ... set headers to see if is download or preview ...
    if (this.job.params.download) {

      if (file.extension) {
        const parsed = path.parse(file.description);
        file.description = path.format({
          ...parsed,
          base: undefined,
          ext: file.extension
        });
      }

      this.res.setHeader("Content-Disposition", `attachment; filename="${file.description}"`);
      this.res.setHeader("Content-Type", FilesOps.mime_types[file.extension] || "application/octet-stream");

    } else {
      this.res.setHeader("Content-Disposition", `inline`);
      this.res.setHeader("Content-Type", FilesOps.mime_types[file.extension] || "application/octet-stream");
    }

    const range = this.req.headers.range;
    if (range) {
      // TODO: NEED REVIEW THIS CODE
      this.res.statusCode = 206;
      const stat = await fs.promises.stat(file_path);
      const fileSize = stat.size;
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      this.res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      this.res.setHeader('Accept-Ranges', 'bytes');
      this.res.setHeader('Content-Length', (end - start) + 1);

      const stream = fs.createReadStream(file_path, {start, end});
      stream.pipe(this.res);

      stream.on("error", () => {
        return this.reportError({ message: "Error append reading file"});
      });

    } else {
      this.res.statusCode = 200;
      // ... send file in chunks ...
      const stream = fs.createReadStream(file_path);
      stream.pipe(this.res);

      stream.on("error", () => {
        return this.reportError({ message: "Error append reading file"});
      });
    }

  }

  async upload_file () {

    if ( !this.job.params?.file_name ) {
      return this.reportError({status: 400, message: "Is necessary indicate the file name in url"});
    }

    // ... create path to file ...
    const uuid = crypto.randomUUID();
    const file_relative_path = path.join(this.job.user_schema, uuid);
    const file_path = path.join(this.config.upload_dir, file_relative_path);

    // ... store file in disk ...
    await this._store_file(file_path);

    // ... add file to database ...
    let folder_id = 0;
    let file_name = this.job.params.file_name;
    let { ext } = await fileTypeFromFile(file_path) || {};
    const { size, birthtime } = await fsp.stat(file_path);

    if ( !ext ) {
      ext = path.extname(this.job.params.file_name).slice(1);
    }

    if (this.job.params?.folder_id) {
      folder_id = this.job.params?.folder_id;
    }

    const file = await this.db.query(
      `INSERT INTO ${this.job.user_schema}.files (uuid, extension, size, birthtime, path, description, folder_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING uuid, extension, size, birthtime, description, folder_id`,
      [uuid, ext, size, birthtime, file_relative_path, file_name, folder_id]
    );

    return this.sendResponse({message: 'File upload with success', response: file.rows[0]});

  }

  async _store_file (file_path) {

    // ... create necessary directorys if dont exis't ...
    await fsp.mkdir(path.dirname(file_path), { recursive: true });

    const writeStream = fs.createWriteStream(file_path, {
      flags: 'w'
    });

    // ... write buffer from http request to file ...
    await new Promise((res, rej) => {
      this.req.pipe(writeStream);

      writeStream.on('finish', () => res());

      writeStream.on('error', async err => {
        console.error(err);
        await fsp.unlink(file_path);
        rej(err);
      });

      this.req.on('error', async err => {
        console.error(err);
        await fsp.unlink(file_path);
        rej(err);
      });
    });

  }
}
