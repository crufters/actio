import { expect, test } from "@jest/globals";

import { createApp } from "./registrator.js";
import { Service } from "./reflect.js";
import { default as request } from "supertest";
import _ from "lodash";

@Service()
class InvalidJSON {
  constructor() {}

  async hey() {
    return 1;
  }
}

test("invalid json", async () => {
  let appA = createApp([InvalidJSON]);

  let response = await request(appA).post("/InvalidJSON/hey").send(null);
  expect(response.status).toBe(200);
  expect(response.body).toEqual(1);
});
