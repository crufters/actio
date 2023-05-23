import { test } from "@jest/globals";
import { createApp } from "../../registrator.js";
//import { default as request } from "supertest";
import { FileService } from "./index.js";
import FormData from "form-data";
import fs from "fs";

const submitForm = (form, url) => {
  return new Promise((resolve, reject) => {
    form.submit(url, (err, res) => {
      if (err) {
        reject(err);
      } else {
        let responseData = "";
        res.on("data", (chunk) => {
          responseData += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData,
          });
        });
      }
    });
  });
};

test("file upload", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;
  let appA = createApp([FileService]);
  let server = appA.listen(randomPortNumber);

  const form = new FormData();
  form.append("file", fs.createReadStream("/tmp/testfile.png"));

  const rsp = await submitForm(
    form,
    `http://localhost:${randomPortNumber}/file/httpFileUpload`
  );
  console.log(rsp);

  server.close();
});
