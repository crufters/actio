/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

/**
 * Parses a 'multipart/form-data' upload request
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
import * as express from "express";
import * as path from "path";

import { ConfigService } from "../config";

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
    .sendFile(
      require("path").join(require("os").homedir(), "opensourceorg", parts[3])
    );
};
