//import teardown from "./teardown";
import fileUpload from "./fileUpload";
import fileServe from "./httpFileServe";

import { File } from "./models";
import { Service, Raw } from "../..";
import { Servicelike } from "../..";
import { ConfigService } from "../config";
import * as fs from "fs";
import * as express from "express";

@Service()
export class FileService implements Servicelike {
  private config: ConfigService;

  constructor(config: ConfigService) {
    this.config = config;
  }

  meta = {
    name: "file",
    typeorm: {
      entities: [File],
    },
  };

  @Raw()
  httpFileUpload(req: express.Request, rsp: express.Response) {
    fileUpload(req, rsp, this.config);
  }

  /**
   * Serve files in a local environments.
   * In production environments files will be served by Google Cloud
   * Storage or Amazon S3 etc (so this endpoint is only used durin
   * local development).
   *
   * In local environments the file upload returns an url like
   * "http:127.0.0.1:8080/file/httpFileServe/img-id-54321.jpeg"
   *
   * In production environments file upload returns an url like
   * "https://https://storage.googleapis.com/example-bucket/img-id-54321.jpg.jpeg"
   */
  @Raw()
  httpFileServe(req: express.Request, rsp: express.Response) {
    fileServe(req, rsp, this.config);
  }

  _onInit(): Promise<void> {
    // for local development only
    fs.promises.mkdir(
      require("path").join(require("os").homedir(), "opensourceorg"),
      { recursive: true }
    );
    return null;
  }
}
