import { test } from "@jest/globals";
import { createApp } from "../../registrator.js";
import { default as request } from "supertest";
import { FileService } from "./index.js";

//const submitForm = (form, url) => {
//  return new Promise((resolve, reject) => {
//    form.submit(url, (err, res) => {
//      if (err) {
//        reject(err);
//      } else {
//        let responseData = "";
//        res.on("data", (chunk) => {
//          responseData += chunk;
//        });
//        res.on("end", () => {
//          resolve({
//            statusCode: res.statusCode,
//            headers: res.headers,
//            body: responseData,
//          });
//        });
//      }
//    });
//  });
//};

test("file upload", async () => {
  let appA = createApp([FileService]);

  const response = await request(appA)
    .post("/file/httpFileUpload")
    .set("Content-Type", "multipart/form-data")
    .attach("file", "/tmp/testfile.png");

  console.log(response.body);
});
