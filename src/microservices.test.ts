import { expect, test } from "@jest/globals";

import { createApp } from "./registrator.js";
import { Service } from "./reflect.js";
import { default as request } from "supertest";
import { error } from "./util.js";
import _ from "lodash";

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
  let appA = createApp([MultiParam]);

  let response = await request(appA)
    .post("/MultiParam/multiParam")
    .send([1, "2"]);

  expect(response.status).toBe(200);
  expect(response.body).toEqual("ok");

  response = await request(appA).post("/MultiParam/multiParam").send([1, "3"]);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("not ok");
});

test("multiParam microservice call", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;
  let appA = createApp([MultiParam]);

  let server = appA.listen(randomPortNumber);

  let appB = createApp([MultiParamProxy], {
    addresses: new Map().set(
      "MultiParamCall",
      "http://localhost:" + randomPortNumber
    ),
  });

  let response = await request(appB)
    .post("/MultiParamProxy/multiParamProxy")
    .send([1, "2"])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual("ok");

  response = await request(appB)
    .post("/multiParamProxy/multiParamProxy")
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
  let appA = createApp([Hi]);

  let server = appA.listen(randomPortNumber);

  let appB = createApp([HiProxy], {
    addresses: new Map().set("Hi", "http://localhost:" + randomPortNumber),
  });

  let response = await request(appB)
    .post("/HiProxy/hiProxy")
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ hi: "hello hi there" });

  server.close();
});

test("microservice proof", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;

  const appB = createApp([HiProxy], {
    addresses: new Map().set("Hi", "http://localhost:" + randomPortNumber),
  });

  let response = await request(appB)
    .post("/Hi/hi")
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(500);

  response = await request(appB)
    .post("/Notexisting/hi")
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

  let appA = createApp([DirectErr]);

  let server = appA.listen(randomPortNumber);

  let appB = createApp([ProxyErr], {
    addresses: new Map().set(
      "DirectErr",
      "http://localhost:" + randomPortNumber
    ),
  });

  let response = await request(appB)
    .post("/ProxyErr/directJsErr")
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
    .send({ hi: "hello" })
    .retry(0);
  expect(response.status).toBe(500);
  expect(
    (response.body.error as string).startsWith('{"stack":"Error: directJsErr')
  ).toBe(true);

  response = await request(appB)
    .post("/ProxyErr/proxyFrameworkErr")
    .send({ hi: "hey" })
    .retry(0);
  expect(response.status).toBe(502);
  expect(response.body.error).toBe("directFrameworkErr");

  response = await request(appB)
    .post("/ProxyErr/directFrameworkErr")
    .send({ hi: "ho" })
    .retry(0);
  expect(response.status).toBe(502);
  expect(response.body.error).toBe("proxy:directFrameworkErr");

  server.close();
});

@Service()
class Array {
  constructor() {}

  async sum(as: number[]): Promise<number> {
    return _.sum(as);
  }
}

@Service()
class ArrayProxy {
  arrayService: Array;
  constructor(arrayService: Array) {
    this.arrayService = arrayService;
  }

  async sumProxy(as: number[]) {
    let rsp = await this.arrayService.sum(as);
    return rsp;
  }
}

test("array api call", async () => {
  let appA = createApp([Array]);

  let response = await request(appA).post("/Array/sum").send([1]).retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual(1);

  response = await request(appA).post("/Array/sum").send([1, 2]).retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual(3);
});

test("array proxy api call", async () => {
  let randomPortNumber = Math.floor(Math.random() * 10000) + 10000;
  let appA = createApp([Array]);

  let server = appA.listen(randomPortNumber);

  let appB = createApp([ArrayProxy], {
    addresses: new Map().set("Array", "http://localhost:" + randomPortNumber),
  });

  let response = await request(appB)
    .post("/ArrayProxy/sumProxy")
    .send([1])
    .retry(0);
  expect(response.status).toBe(200);
  expect(response.body).toEqual(1);

  response = await request(appB)
    .post("/ArrayProxy/sumProxy")
    .send([1, 2])
    .retry(3);
  expect(response.status).toBe(200);
  expect(response.body).toEqual(3);

  server.close();
});
