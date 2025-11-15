import Job from "../../classes/job.js";
import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import fss from 'fs';
import HTTPError from "../../classes/http-error.js";
import sharp from 'sharp';
import { fileTypeFromFile } from 'file-type';
import { spawn } from "node:child_process";
import { exiftool } from 'exiftool-vendored';
import { finished } from 'stream/promises';

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

    // filter[thumbnail]
    let file_aboslute = '';
    if ( this.job.params.hasOwnProperty('filter[thumbnail]') ) {
      file_aboslute = path.join(this.config.upload_dir, this.job.user_schema, 'templates', file.uuid.toString());
    } else {
      file_aboslute = path.join(this.config.upload_dir, this.job.user_schema, file.uuid.toString());
    }

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
    stream.on('error', (e) => {
      this.logger.error(e);
      return this.reportError({ message: "Error append reading file"});
    });

    stream.pipe(this.res);
    await finished(stream);

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
        // ... read content of image, to get birthdate ...
        const tags = await exiftool.read(file_absolute);
        if ( tags.DateTimeOriginal || tags.CreateDate ) {
          const exifDate = tags.DateTimeOriginal || tags.CreateDate;
          const tzOffsetMs = (exifDate.tzoffsetMinutes || 0) * 60 * 1000;

          // cria Date em UTC
          const utcTimestamp = Date.UTC(
            exifDate.year,
            exifDate.month - 1, // JS months 0-11
            exifDate.day,
            exifDate.hour,
            exifDate.minute,
            exifDate.second
          );

          const date = new Date(utcTimestamp - tzOffsetMs);
          if (date && !isNaN(date)) {
            file_stats.birthtime = date;
          }
        }
      } catch (e) {}


      try {

        if ( !FsOps.imagesValideMimeTypes.includes(mime_type.mime) ) {
          // JPEG, PNG, WebP, GIF and AVIF
          await fs.unlink(file_absolute);
          throw new Error('Invalid image type received');
        }

        // ... create thumbnail ...
        let image = sharp(file_absolute, { failOn: 'truncated' });

        await fs.mkdir(path.dirname(file_thumbail_absolute), { recursive: true });

        switch (mime_type.mime) {
          case "image/jpeg":
            await image
                  .rotate()
                  .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
                  .toFormat('jpeg', { quality: 50 })
                  .toFile(file_thumbail_absolute);
                break;
          case "image/png":
            await image
                  .toFormat('png', { compressionLevel: 9 })
                  .rotate()
                  .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
                  .toFile(file_thumbail_absolute);
                break;
          case "image/webp":
            await image
                  .toFormat('webp', { quality: 50 })
                  .rotate()
                  .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
                  .toFile(file_thumbail_absolute);
                break;
          case "image/gif":
            // Sharp converte GIFs estáticos; para animados use giflossy ou outro lib
            await image
                  .toFormat('gif', { effort: 7 })
                  .rotate()
                  .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
                  .toFile(file_thumbail_absolute);
                break;
          case "image/avif":
            await image
                  .toFormat('avif', { quality: 60 })
                  .rotate()
                  .resize({ width: 500, height: 500, fit: 'inside', withoutEnlargement: true })
                  .toFile(file_thumbail_absolute);
                break;
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
        // ... read content of image, to get birthdate ...
        const tags = await exiftool.read(file_absolute);
        if ( tags.DateTimeOriginal || tags.CreateDate ) {
          const exifDate = tags.DateTimeOriginal || tags.CreateDate;
          const tzOffsetMs = (exifDate.tzoffsetMinutes || 0) * 60 * 1000;

          // cria Date em UTC
          const utcTimestamp = Date.UTC(
            exifDate.year,
            exifDate.month - 1, // JS months 0-11
            exifDate.day,
            exifDate.hour,
            exifDate.minute,
            exifDate.second
          );

          const date = new Date(utcTimestamp - tzOffsetMs);
          if (date && !isNaN(date)) {
            file_stats.birthtime = date;
          }

        }
      } catch (e) {}

      try {

        await fs.mkdir(path.dirname(file_thumbail_absolute), { recursive: true });

        await new Promise((res, rej) => {

          const ffmpeg = spawn("ffmpeg", [
            '-i', file_absolute,
            "-vf", "scale='min(1200,iw)':'min(1200,ih)':force_original_aspect_ratio=decrease", // max width/height 1200
            '-frames:v', '1',
            '-f', 'image2',
            "-vcodec", "libwebp",
            "-compression_level", "5",  // 0–6, sendo 6 o máximo
            "-qscale", "60",            // qualidade (0–100)
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
