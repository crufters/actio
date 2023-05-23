import { expect, test } from "@jest/globals";
import { createApp } from "../../registrator.js";
import { default as request } from "supertest";
import { FileService } from "./index.js";
//import { url } from "inspector";

test("file upload", async () => {
  let appA = createApp([FileService]);

  let rsp = await request(appA)
    .post("/file/httpFileUpload") // Replace '/upload' with the actual endpoint that handles file uploads
    .attach("file", "/tmp/testfile.png") // Replace 'file' with the field name for file upload and provide the path to the file
    .expect(200);
  console.log(rsp.body);
  expect(rsp.body).toBeTruthy();

  // rsp = request(appA).post("/FileService/httpFileServe/" + rsp.url.split("/")[]).send();
});
