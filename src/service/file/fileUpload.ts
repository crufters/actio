// https://cloud.google.com/functions/docs/writing/http#multipart_data_and_file_uploads

/**
 * Parses a 'multipart/form-data' upload request
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { nanoid } from "nanoid";
import * as stream from "stream";
// Imports the Google Cloud client library
import { Storage } from "@google-cloud/storage";
import * as express from "express";

// Node.js doesn't have a built-in multipart/form-data parsing library.
// Instead, we can use the 'busboy' library from NPM to parse these requests.
import busboy from "busboy";
import { default as env } from "../../env.js";
import { ConfigService } from "../config/index.js";

interface File {
  name: string;
  path: string;
}

interface FileResponse {
  originalName: string;
  size: number;
  url: string;
}

export default async (
  req: express.Request,
  res: express.Response,
  config: ConfigService
) => {
  let cfg = await config.configRead({});

  if (req.method !== "POST") {
    // Return a "method not allowed" error
    return res.status(405).end();
  }

  const bb = busboy({ headers: req.headers });
  const tmpdir = os.tmpdir();

  // This object will accumulate all the fields, keyed by their name
  const fields = {};

  // This object will accumulate all the uploaded files, keyed by their name.
  const uploads = {};

  // This code will process each non-file field in the form.
  bb.on("field", (fieldname, val) => {
    /**
     *  TODO(developer): Process submitted field values here
     */
    console.log(`Processed field ${fieldname}: ${val}.`);
    fields[fieldname] = val;
  });

  const fileWrites = [];

  // This code will process each file uploaded.
  bb.on("file", (filename, state, file) => {
    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    console.log(`Processed file  ${filename}`);
    const filepath = path.join(tmpdir, filename);
    uploads[filename] = filepath;

    const writeStream = fs.createWriteStream(filepath);
    state.pipe(writeStream);

    // File was processed by Busboy; wait for it to be written.
    // Note: GCF may not persist saved files across invocations.
    // Persistent files must be kept in other locations
    // (such as Cloud Storage buckets).
    const promise = new Promise((resolve, reject) => {
      state.on("end", () => {
        writeStream.end();
      });
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
    fileWrites.push(promise);
  });

  // Triggered once all uploaded files are processed by Busboy.
  // We still need to wait for the disk writes (saves) to complete.
  bb.on("close", async () => {
    await Promise.all(fileWrites);

    // https://stackoverflow.com/questions/44945376/how-to-upload-an-in-memory-file-data-to-google-cloud-storage-using-nodejs

    var files: File[] = [];
    for (const filename in uploads) {
      files.push({
        name: filename,
        path: uploads[filename],
      });
    }

    var filesRsp: FileResponse[] = [];
    await Promise.all(
      files.map(async (file) => {
        // @todo make this not come from the data
        if (cfg.config?.data?.isProduction) {
          return uploadToGoogleStorage(filesRsp, cfg.config, file);
        } else {
          return saveFileToLocation(filesRsp, cfg.config, file);
        }
      })
    );
    res
      .send(
        JSON.stringify({
          files: filesRsp,
        })
      )
      .end();
  });

  req.pipe(bb);
};

function saveFileToLocation(
  filesRsp: FileResponse[],
  cfg: { [key: string]: any },
  file: File
): Promise<void> {
  let f = fs.readFileSync(file.path);
  fs.writeFile(
    require("path").join(require("os").homedir(), "actio-files", file.name),
    f,
    function (err) {
      if (err) {
        return console.log(err);
      }
    }
  );
  // @todo make this async
  filesRsp.push({
    originalName: file.name,
    size: f.length,
    url: "http://127.0.0.1:8080/file/httpFileServe/" + file.name,
  });
  return null;
}

function uploadToGoogleStorage(
  filesRsp: FileResponse[],
  cfg: { [key: string]: any },
  file: File
): Promise<void> {
  const id = nanoid();

  // Creates a client
  const cloudStorage = new Storage();
  let dataStream = new stream.PassThrough();

  let fileName = id + "." + file.name.split(".")[1];
  let gcFile = cloudStorage
    .bucket(cfg.bucketName)
    // get extension from file
    .file(fileName);

  // file was sent under key "file"
  // this endpoint currently only support saving a single file
  let f = fs.readFileSync(file.path);
  // baseurl example https://storage.googleapis.com/storage/v1
  let baseUrl = cloudStorage.baseUrl;
  if (env.isProd) {
    // need to truncate this as baseurl != image link base url for some reason
    baseUrl = baseUrl.replace("/storage/v1", "");
  }
  filesRsp.push({
    originalName: file.name,
    size: f.length,
    url: baseUrl + "/" + cfg.bucketName + "/" + fileName,
  });
  dataStream.push(f);
  dataStream.push(null);

  return new Promise((resolve, reject) => {
    dataStream
      .pipe(
        gcFile.createWriteStream({
          resumable: false,
          validation: false,
          public: true,
          metadata: { "Cache-Control": "public, max-age=31536000" },
        })
      )
      .on("error", (error: Error) => {
        reject(error);
      })
      .on("finish", () => {
        //for (const file in uploads) {
        //  fs.unlinkSync(uploads[file]);
        //}
        resolve();
      });
  });
}
