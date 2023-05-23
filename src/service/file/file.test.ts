import { test } from "@jest/globals";
import { createApp } from "../../registrator.js";
import { default as request } from "supertest";
import { FileService } from "./index.js";


test("file upload", async () => {
  let appA = createApp([FileService]);

  const response = await request(appA)
    .post("/file/httpFileUpload")
    .set("Content-Type", "multipart/form-data")
    .attach("file", "/tmp/testfile.png");

  console.log(response.body);
});
