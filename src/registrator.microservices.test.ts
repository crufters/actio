import { expect, test } from "@jest/globals";

import { Registrator } from "./registrator.js";
import express from "express";
import { Service } from "./reflect.js";
import { default as request } from "supertest";

@Service()
class MSA {
  meta = {
    name: "msa",
  };
  constructor() {}

  async a(dat) {
    console.log("MSA.a: called with", dat);
    return { hi: dat.hi };
  }
}

@Service()
class MSB {
  meta = {
    name: "msb",
  };

  aService: MSA;
  constructor(aService: MSA) {
    this.aService = aService;
  }

  async b(dat) {
    let rsp = await this.aService.a(dat);
    console.log("MSB.b: MSB.a responded", rsp);
    return { hi: rsp.hi + "b2" };
  }
}

test("test microservice call", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appA = express();
  appA.use(express.json());

  let reg = new Registrator(appA);

  reg.register([MSA]);

  let server;
  setTimeout(() => {
    server = appA.listen(randomPortNumber);
  }, 1);

  const appB = express();
  appB.use(express.json());

  let regB = new Registrator(appB);
  regB.addresses.set("MSA", "http://localhost:" + randomPortNumber);
  regB.register([MSB]);

  let response = await request(appB)
    .post("/MSB/b")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ hi: "hellob2" });

  server.close();
});

test("microservice proof", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appB = express();
  appB.use(express.json());

  let regB = new Registrator(appB);
  regB.addresses.set("MSA", "http://localhost:" + randomPortNumber);
  regB.register([MSB]);

  let response = await request(appB)
    .post("/MSB/b")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(500);
});
