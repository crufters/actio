import { expect, test } from "@jest/globals";

import { Registrator } from "./registrator.js";
import express from "express";
import { Service } from "./reflect.js";
import { default as request } from "supertest";
import { error } from "./util.js";

@Service()
class MserviceA {
  constructor() {}

  async a(dat) {
    return { hi: dat.hi };
  }

  async aerr() {
    throw new Error("oops");
  }

  async aerr2() {
    throw error("oops2", 502);
  }
}

@Service()
class MserviceB {
  aService: MserviceA;
  constructor(aService: MserviceA) {
    this.aService = aService;
  }

  async b(dat) {
    let rsp = await this.aService.a(dat);
    return { hi: rsp.hi + "b2" };
  }

  async appendHi(dat) {
    let rsp = await this.aService.a(dat);
    return { hi: rsp.hi + "hi again" };
  }

  async berr() {
    let rsp = await this.aService.aerr();
    return rsp;
  }

  async berr2() {
    let rsp = await this.aService.aerr2();
    return rsp;
  }

  async directErr() {
    throw new Error("oops3");
  }

  async directErr2() {
    throw error("oops4", 502);
  }
}

@Service()
class ArrayCall {
  constructor() {}

  async array(a: number, b: string) {
    if (a == 1 && b == "2") {
      return "ok";
    }
    return "not ok";
  }
}

@Service()
class ArrayProxy {
  arrayCallService: ArrayCall;
  constructor(arrayCallService: ArrayCall) {
    this.arrayCallService = arrayCallService;
  }

  async arrayProxy(a: number, b: string) {
    let rsp = await this.arrayCallService.array(a, b);
    return rsp;
  }
}

test("array api call", async () => {
  const appA = express();
  appA.use(express.json());

  let regB = new Registrator(appA);
  regB.register([ArrayCall]);

  let response = await request(appA)
    .post("/ArrayCall/array")
    .set({})
    .send([1, "2"])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("ok");

  response = await request(appA)
    .post("/ArrayCall/array")
    .set({})
    .send([1, "3"])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("not ok");
});

test("array microservice call", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appA = express();
  appA.use(express.json());

  let reg = new Registrator(appA);

  reg.register([ArrayCall]);

  let server;
  setTimeout(() => {
    server = appA.listen(randomPortNumber);
  }, 1);

  const appB = express();
  appB.use(express.json());

  let regB = new Registrator(appB);
  regB.addresses.set("ArrayCall", "http://localhost:" + randomPortNumber);
  regB.register([ArrayProxy]);

  let response = await request(appB)
    .post("/ArrayProxy/arrayProxy")
    .set({})
    .send([1, "2"])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("ok");

  response = await request(appB)
    .post("/ArrayProxy/arrayProxy")
    .set({})
    .send([1, "3"])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("not ok");

  server.close();
});

@Service()
class Hi {
  constructor() {}

  async hi(dat) {
    return { hi: dat.hi };
  }
}

@Service()
class HiProxy {
  hiService: Hi;
  constructor(hiService: Hi) {
    this.hiService = hiService;
  }

  async hiProxy(dat) {
    let rsp = await this.hiService.hi(dat);
    return { hi: rsp.hi + " hi there" };
  }
}

test("microservice call", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appA = express();
  appA.use(express.json());

  let reg = new Registrator(appA);

  reg.register([Hi]);

  let server;
  setTimeout(() => {
    server = appA.listen(randomPortNumber);
  }, 1);

  const appB = express();
  appB.use(express.json());

  let regB = new Registrator(appB);
  regB.addresses.set("MserviceA", "http://localhost:" + randomPortNumber);
  regB.register([HiProxy]);

  let response = await request(appB)
    .post("/HiProxy/hiProxy")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ hi: "hello hi there" });

  server.close();
});

test("microservice proof", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appB = express();
  appB.use(express.json());

  let regB = new Registrator(appB);
  regB.addresses.set("MserviceA", "http://localhost:" + randomPortNumber);
  regB.register([MserviceB]);

  let response = await request(appB)
    .post("/MserviceB/b")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(500);

  response = await request(appB)
    .post("/Notexisting/b")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(404);
});

// @todo these tests are a bit hard to follow
test("microservice error propagates", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appA = express();
  appA.use(express.json());

  let reg = new Registrator(appA);

  reg.register([MserviceA]);

  let server;
  setTimeout(() => {
    server = appA.listen(randomPortNumber);
  }, 1);

  const appB = express();
  appB.use(express.json());

  let regB = new Registrator(appB);
  regB.addresses.set("MserviceA", "http://localhost:" + randomPortNumber);
  regB.register([MserviceB]);

  let response = await request(appB)
    .post("/MserviceB/directErr")
    .set({})
    .send({})
    .retry(0);
  expect(response.status).toBe(500);
  expect(
    (response.body.error as string).startsWith('{"stack":"Error: oops3')
  ).toBe(true);

  response = await request(appB)
    .post("/MserviceB/berr")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(500);
  expect(
    (response.body.error as string).startsWith('{"stack":"Error: oops')
  ).toBe(true);

  response = await request(appB)
    .post("/MserviceB/directErr2")
    .set({})
    .send({ hi: "hey" })
    .retry(0);
  expect(response.status).toBe(502);
  expect(response.body.error).toBe("oops4");

  response = await request(appB)
    .post("/MserviceB/berr2")
    .set({})
    .send({ hi: "ho" })
    .retry(0);
  expect(response.status).toBe(502);
  expect(response.body.error).toBe("oops2");

  server.close();
});
