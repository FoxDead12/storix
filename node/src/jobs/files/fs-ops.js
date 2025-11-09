import Job from "../../classes/job.js";
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import fss from 'fs';
import HTTPError from "../../classes/http-error.js";
import sharp from 'sharp';
import { fileTypeFromFile } from 'file-type';
import { spawn } from "node:child_process";

// export default class FsOps extends Job {
//
//   static mime_types = {
//     pdf: 'application/pdf',
//     txt: 'text/plain',
//     html: 'text/html',
//     exe: 'application/octet-stream',
//     zip: 'application/zip',
//     doc: 'application/msword',
//     docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     xls: 'application/vnd.ms-excel',
//     xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     ppt: 'application/vnd.ms-powerpoint',
//     pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
//     gif: 'image/gif',
//     png: 'image/png',
//     jpeg: 'image/jpeg',
//     jpg: 'image/jpeg',
//     php: 'text/plain',
//     mp4: 'video/mp4',
//     mov: 'video/quicktime',            // usado por iPhone
//     m4v: 'video/x-m4v',                // iOS
//     m4a: 'audio/m4a',                   // áudio iOS
//     aac: 'audio/aac',
//     wav: 'audio/wav',
//     mp3: 'audio/mpeg',
//     bmp: 'image/bmp',
//     tiff: 'image/tiff',
//     ico: 'image/x-icon',
//     heic: 'image/heic',                 // formato iPhone moderno
//     webp: 'image/webp'
//   };
//
//   async perform (job) {
//     this.job = job;
//
//     switch (this.req.method) {
//       case 'GET':
//         await this.get_file();
//         break;
//       case 'POST':
//         await this.upload_file();
//         break;
//       default:
//         return this.reportError({status: 405, message: "Method Not Allowed"});
//     }
//
//   }
//
//   async get_file () {
//
//     // ... get uuid from url ...
//     const match = this.req.url.match(/^\/files\/([A-Za-z0-9-]+)/);
//     if (!match || !match[1]) {
//       return this.reportError({ message: "Need indicate the item wuant get in url"});
//     }
//     const uuid = match[1];
//
//     // ... get file from db ...
//     let file = await this.db.query(
//       `SELECT id, path, description, extension FROM ${this.job.user_schema}.files WHERE uuid = $1`,
//       [uuid]
//     );
//
//     // ... validate if file exist ...
//     if (file.rows.length == 0) {
//       return this.reportError({ message: "Don't exist a file width this uuid"});
//     } else {
//       file = file.rows[0];
//     }
//     const file_path = path.join(this.config.upload_dir, file.path);
//
//     // ... set headers to see if is download or preview ...
//     if (this.job.params.download) {
//
//       if (file.extension) {
//         const parsed = path.parse(file.description);
//         file.description = path.format({
//           ...parsed,
//           base: undefined,
//           ext: file.extension
//         });
//       }
//
//       this.res.setHeader("Content-Disposition", `attachment; filename="${file.description}"`);
//       this.res.setHeader("Content-Type", FsOps.mime_types[file.extension] || "application/octet-stream");
//
//     } else {
//       this.res.setHeader("Content-Disposition", `inline`);
//       this.res.setHeader("Content-Type", FsOps.mime_types[file.extension] || "application/octet-stream");
//     }
//
//     const range = this.req.headers.range;
//     if (range) {
//       // TODO: NEED REVIEW THIS CODE
//       this.res.statusCode = 206;
//       const stat = await fs.promises.stat(file_path);
//       const fileSize = stat.size;
//       const parts = range.replace(/bytes=/, "").split("-");
//       const start = parseInt(parts[0], 10);
//       const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
//
//       this.res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
//       this.res.setHeader('Accept-Ranges', 'bytes');
//       this.res.setHeader('Content-Length', (end - start) + 1);
//
//       const stream = fs.createReadStream(file_path, {start, end});
//       stream.pipe(this.res);
//
//       stream.on("error", () => {
//         return this.reportError({ message: "Error append reading file"});
//       });
//
//     } else {
//       this.res.statusCode = 200;
//       // ... send file in chunks ...
//       const stream = fs.createReadStream(file_path);
//       stream.pipe(this.res);
//
//       stream.on("error", () => {
//         return this.reportError({ message: "Error append reading file"});
//       });
//     }
//
//   }
//
//   async upload_file () {
//
//     if ( !this.job.params?.file_name ) {
//       return this.reportError({status: 400, message: "Is necessary indicate the file name in url"});
//     }
//
//     // ... create path to file ...
//     const uuid = crypto.randomUUID();
//     const file_relative_path = path.join(this.job.user_schema, uuid);
//     const file_path = path.join(this.config.upload_dir, file_relative_path);
//
//     // ... store file in disk ...
//     await this._store_file(file_path);
//
//     // ... add file to database ...
//     let folder_id = 0;
//     let file_name = this.job.params.file_name;
//     let { ext } = await fileTypeFromFile(file_path) || {};
//     const { size, birthtime } = await fsp.stat(file_path);
//
//     if ( !ext ) {
//       ext = path.extname(this.job.params.file_name).slice(1);
//     }
//
//     if (this.job.params?.folder_id) {
//       folder_id = this.job.params?.folder_id;
//     }
//
//     const file = await this.db.query(
//       `INSERT INTO ${this.job.user_schema}.files (uuid, extension, size, birthtime, path, description, folder_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING uuid, extension, size, birthtime, description, folder_id`,
//       [uuid, ext, size, birthtime, file_relative_path, file_name, folder_id]
//     );
//
//     return this.sendResponse({message: 'File upload with success', response: file.rows[0]});
//
//   }
//
//   async _store_file (file_path) {
//
//     // ... create necessary directorys if dont exis't ...
//     await fsp.mkdir(path.dirname(file_path), { recursive: true });
//
//     const writeStream = fs.createWriteStream(file_path, {
//       flags: 'w'
//     });
//
//     // ... write buffer from http request to file ...
//     await new Promise((res, rej) => {
//       this.req.pipe(writeStream);
//
//       writeStream.on('finish', () => res());
//
//       writeStream.on('error', async err => {
//         console.error(err);
//         await fsp.unlink(file_path);
//         rej(err);
//       });
//
//       this.req.on('error', async err => {
//         console.error(err);
//         await fsp.unlink(file_path);
//         rej(err);
//       });
//     });
//
//   }
// }

export default class FsOps extends Job {

  static imagesValideMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
  ];

  async perform (job) {

    this.job = job;

    switch ( this.req.method ) {
      case 'GET':
        await this.get();
        break;
      case 'POST':
        await this.upload();
        break;
      default:
        return this.reportError({status: 405, message: 'Method Not Allowed'});
    }

  }

  async get () {

    // ... parse uuid from url ...
    const match = this.req.url.match(/^\/files\/([A-Za-z0-9-]+)/);
    const uuid = match[1];
    if (!match || !match[1]) {
      return this.reportError({ message: "Need indicate the uuid of file"});
    }

    // ... get file from database ...
    let file = await this.db.query(`SELECT uuid, path, description, extension FROM ${this.job.user_schema}.files WHERE uuid = $1`, [uuid]);
    file = file.rows[0];

    const file_aboslute = path.join(this.config.upload_dir, this.job.user_schema, 'templates', file.uuid.toString());

    // ... check if is a range request ...
    const range = this.req.headers.range;
    if ( range ) {
      this.res.statusCode = 206;

      const stats = await fs.stat(file_aboslute);
      const fileSize = stats.size;

      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      this.res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      this.res.setHeader('Accept-Ranges', 'bytes');
      this.res.setHeader('Content-Length', (end - start) + 1);
      var stream = fss.createReadStream(file_aboslute, {start, end});
    } else {
      var stream = fss.createReadStream(file_aboslute);
    }

    // ... upload all file to client ...
    stream.pipe(this.res);
    stream.on('error', (e) => {
      this.logger.error(e);
      return this.reportError({ message: "Error append reading file"});
    });

  }

  async upload () {

    // ... check get file name ...
    const file_name = this.job.params.file_name;
    const directory_id = Number(this.job.params.directory) || 0;
    if ( !file_name ) {
      return this.reportError({status: 400, message: "Is necessary indicate the file name"});
    }

    // ... TODO, CHECK IF DIRECTORY EXIST ...

    // ... generate uuid and path to file ...
    const uuid = crypto.randomUUID();
    const file_relative = path.join(this.job.user_schema, uuid);
    const file_absolute = path.join(this.config.upload_dir, file_relative);
    const file_thumbail_absolute = path.join(this.config.upload_dir, this.job.user_schema, 'templates', uuid);

    // ... create folder if dont exist ...
    await fs.mkdir(path.dirname(file_absolute), { recursive: true });

    // ... create a write stream ...
    const writeStream = fss.createWriteStream(file_absolute, { flags: 'w' });

    // ... get file from http to a file ...
    await new Promise((res, rej) => {
      this.req.pipe(writeStream);
      writeStream.on('finish', () => res());

      writeStream.on('error', async (error) => {
        this.logger.error(error);
        this.req.unpipe(writeStream);
        writeStream.destroy();
        writeStream.on('close', async () => {
          await fs.unlink(file_absolute);
          rej(new HTTPError('Error uploading the file', 400));
        });
      });

      this.req.on("aborted", async () => {
        this.req.unpipe(writeStream);
        writeStream.destroy();
        writeStream.on('close', async () => {
          await fs.unlink(file_absolute);
          rej(new HTTPError('Error uploading the file', 400));
        });
      });
    });

    // ... get file stats ...
    const file_stats = await fs.stat(file_absolute);

    // ... get real type extension of file ...
    const mime_type = await fileTypeFromFile(file_absolute);

    if ( !mime_type ) {
      // ... delete file ...
      await fs.unlink(file_absolute);
      throw new HTTPError('Invalid mime type detect', 400)
    }

    // ... check mime type to see each file type ...
    let file_type = null;
    if (mime_type.mime.startsWith('image/')) {

      file_type = 'image';

      try {

        if ( !FsOps.imagesValideMimeTypes.includes(mime_type.mime) ) {
          // JPEG, PNG, WebP, GIF and AVIF
          await fs.unlink(file_absolute);
          throw new Error('Invalid image type received');
        }

        // ... create thumbnail ...
        let image = sharp(file_absolute);
        await fs.mkdir(path.dirname(file_thumbail_absolute), { recursive: true });

        switch (mime_type.mime) {
          case "image/jpeg":
          case "image/jpg":
            await image.jpeg({ quality: 50 }).rotate().resize({ width: 1200, withoutEnlargement: true }).toFile(file_thumbail_absolute); break;
          case "image/png":
            await image.png({ compressionLevel: 9 }).rotate().resize({ width: 1200, withoutEnlargement: true }).toFile(file_thumbail_absolute);  break;
          case "image/webp":
            await image.webp({ quality: 50 }).rotate().resize({ width: 1200, withoutEnlargement: true }).toFile(file_thumbail_absolute); break;
          case "image/gif":
            // Sharp converte GIFs estáticos; para animados use giflossy ou outro lib
            await image.gif({ effort: 7 }).rotate().resize({ width: 1200, withoutEnlargement: true }).toFile(file_thumbail_absolute); break;
          case "image/avif":
            await image.avif({ quality: 60 }).rotate().resize({ width: 1200, withoutEnlargement: true }).toFile(file_thumbail_absolute); break;
          default:
            await fs.unlink(file_absolute);
            throw new HTTPError('Invalid mime type detect, can compress', 400);
        }

      } catch (e) {
        this.logger.error(e);
        await fs.unlink(file_absolute);
        throw new HTTPError('Invalid mime type detect, can compress', 400);
      }

    } else if (mime_type.mime.startsWith('video/')) {

      file_type = 'video';

      try {

        await fs.mkdir(path.dirname(file_thumbail_absolute), { recursive: true });

        await new Promise((res, rej) => {

          const ffmpeg = spawn("ffmpeg", [
            '-i', file_absolute,
            "-vf", "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease", // max width/height 1200
            '-frames:v', '1',
            '-f', 'image2',
            "-vcodec", "libwebp",
            "-compression_level", "6",  // 0–6, sendo 6 o máximo
            "-qscale", "50",            // qualidade (0–100)
            file_thumbail_absolute
          ]);

          ffmpeg.on('error', async (e) => {
            this.logger.error(e)
            rej(e);
          });

          ffmpeg.on('close', (code) => {
            if (code != 0) {
              return rej(code)
            }
            res();
          });

        });

      } catch (e) {
        this.logger.error(e);
        await fs.unlink(file_absolute);
        throw new HTTPError('Error uploading video', 500);
      }

    } else {
      file_type = 'file';
    }

    // ... store in database ...
    const file = await this.db.query(`
      INSERT INTO ${this.job.user_schema}.files
      (uuid, type, extension, size, birthtime, path, description, folder_id) VALUES
      ($1  , $2  , $3       , $4  , $5       , $6  , $7         , $8) RETURNING uuid, extension, size, birthtime, path, description
    `, [
      uuid,
      file_type,
      mime_type.ext,
      file_stats.size,
      file_stats.birthtime,
      file_relative,
      file_name,
      directory_id
    ]);

    return this.sendResponse({ response: file.rows[0] });
  }

}
