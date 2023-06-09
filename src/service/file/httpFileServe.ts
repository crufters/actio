/**
 * Parses a 'multipart/form-data' upload request
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
import * as express from "express";
import * as path from "path";
import * as os from "os";

import { ConfigService } from "../config/index.js";

const actioFolder = "actio-files";

export default async (
  req: express.Request,
  res: express.Response,
  config: ConfigService
) => {
  // example path "http://127.0.0.1:8080/file/httpFileServe/img-id-54321.jpeg"
  let parts = req.originalUrl.split("/");

  if (parts.length < 4) {
    throw "file path malformed";
  }

  console.log("serving file", path.basename(parts[3]));
  res;
  res
    .contentType(path.basename(parts[3]))
    // @todo get this from config
    .sendFile(path.join(os.homedir(), actioFolder, parts[3]));
};
