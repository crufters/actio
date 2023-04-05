import { expect, test } from "@jest/globals";

import { Registrator } from "./registrator.js";
import express from "express";
import { Service } from "./reflect.js";
import { default as request } from "supertest";
import { error } from "./util.js";

@Service()
class MultiParam {
  constructor() {}

  async multiParam(a: number, b: string) {
    if (a == 1 && b == "2") {
      return "ok";
    }
    return "not ok";
  }
}

@Service()
class MultiParamProxy {
  multiParamService: MultiParam;
  constructor(multiParamService: MultiParam) {
    this.multiParamService = multiParamService;
  }

  async multiParamProxy(a: number, b: string) {
    let rsp = await this.multiParamService.multiParam(a, b);
    return rsp;
  }
}

test("multiparam api call", async () => {
  const appA = express();
  appA.use(express.json());

  let regB = new Registrator(appA);
  regB.register([MultiParam]);

  let response = await request(appA)
    .post("/MultiParam/multiParam")
    .set({})
    .send([1, "2"])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("ok");

  response = await request(appA)
    .post("/MultiParam/multiParam")
    .set({})
    .send([1, "3"])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("not ok");
});

test("multiParam microservice call", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appA = express();
  appA.use(express.json());

  let reg = new Registrator(appA);

  reg.register([MultiParam]);

  let server;
  setTimeout(() => {
    server = appA.listen(randomPortNumber);
  }, 1);

  const appB = express();
  appB.use(express.json());

  let regB = new Registrator(appB);
  regB.addresses.set("MultiParamCall", "http://localhost:" + randomPortNumber);
  regB.register([MultiParamProxy]);

  let response = await request(appB)
    .post("/MultiParamProxy/multiParamProxy")
    .set({})
    .send([1, "2"])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("ok");

  response = await request(appB)
    .post("/multiParamProxy/multiParamProxy")
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
  regB.addresses.set("Hi", "http://localhost:" + randomPortNumber);
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
  regB.addresses.set("Hi", "http://localhost:" + randomPortNumber);
  regB.register([HiProxy]);

  let response = await request(appB)
    .post("/Hi/hi")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(500);

  response = await request(appB)
    .post("/Notexisting/hi")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(404);
});

@Service()
class DirectErr {
  constructor() {}

  async a(dat) {
    return { hi: dat.hi };
  }

  async directJsErr() {
    throw new Error("directJsErr");
  }

  async directFrameworkErr() {
    throw error("directFrameworkErr", 502);
  }
}

@Service()
class ProxyErr {
  directErrService: DirectErr;
  constructor(directErrService: DirectErr) {
    this.directErrService = directErrService;
  }

  async proxyJsErr() {
    let rsp = await this.directErrService.directJsErr();
    return rsp;
  }

  async proxyFrameworkErr() {
    let rsp = await this.directErrService.directFrameworkErr();
    return rsp;
  }

  async directJsErr() {
    throw new Error("proxy:directJsErr");
  }

  async directFrameworkErr() {
    throw error("proxy:directFrameworkErr", 502);
  }
}

// @todo these tests are a bit hard to follow
test("microservice error propagates", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appA = express();
  appA.use(express.json());

  let reg = new Registrator(appA);

  reg.register([DirectErr]);

  let server;
  setTimeout(() => {
    server = appA.listen(randomPortNumber);
  }, 1);

  const appB = express();
  appB.use(express.json());

  let regB = new Registrator(appB);
  regB.addresses.set("DirectErr", "http://localhost:" + randomPortNumber);
  regB.register([ProxyErr]);

  let response = await request(appB)
    .post("/ProxyErr/directJsErr")
    .set({})
    .send({})
    .retry(0);
  expect(response.status).toBe(500);
  expect(
    (response.body.error as string).startsWith(
      '{"stack":"Error: proxy:directJsErr'
    )
  ).toBe(true);

  response = await request(appB)
    .post("/ProxyErr/proxyJsErr")
    .set({})
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(500);
  expect(
    (response.body.error as string).startsWith('{"stack":"Error: directJsErr')
  ).toBe(true);

  response = await request(appB)
    .post("/ProxyErr/proxyFrameworkErr")
    .set({})
    .send({ hi: "hey" })
    .retry(0);
  expect(response.status).toBe(502);
  expect(response.body.error).toBe("directFrameworkErr");

  response = await request(appB)
    .post("/ProxyErr/directFrameworkErr")
    .set({})
    .send({ hi: "ho" })
    .retry(0);
  expect(response.status).toBe(502);
  expect(response.body.error).toBe("proxy:directFrameworkErr");

  server.close();
});
