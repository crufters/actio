import { expect, test } from "@jest/globals";

import { Registrator } from "./registrator.js";
import express from "express";
import { Service, Unexposed, Raw } from "./reflect.js";
import { default as request } from "supertest";
import { error } from "./util.js";

@Service()
class A1 {
  meta = {
    name: "aone",
  };
  constructor() {}

  async a1() {
    return { hi: "a1" };
  }
}

@Service()
class A2Service {
  constructor() {}

  async a2() {
    return { hi: "a2" };
  }
}

test("test meta name", async () => {
  const app = express();
  app.use(express.json());

  let reg = new Registrator(app);

  reg.register([A1, A2Service]);

  let response = await request(app).post("/aone/a1").send({});
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ hi: "a1" });

  // test fallback

  response = await request(app).post("/A1/a1").send({});
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ hi: "a1" });

  response = await request(app).post("/A2/a2").send({});
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ hi: "a2" });
});

@Service()
class A {
  constructor() {}

  async a() {
    return { hi: 5 };
  }

  @Unexposed()
  async b() {
    return { hi: 5 + 1 };
  }
}

test("test unexposed", async () => {
  const app = express();
  app.use(express.json());

  let reg = new Registrator(app);

  reg.register([A]);

  let response = await request(app).post("/A/a").send({});
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ hi: 5 });

  response = await request(app).post("/A/b").send({});
  expect(response.status).toBe(404);
});

@Service()
class B {
  constructor() {}

  async a() {
    return { hi: 5 };
  }

  @Raw()
  async b(req: express.Request, res: express.Response) {
    res.send(JSON.stringify({ hi: req.headers["hi"] })).end();
  }
}

test("test raw", async () => {
  const app = express();
  app.use(express.json());

  let reg = new Registrator(app);

  reg.register([B]);

  let response = await await request(app)
    .post("/B/b")
    .set({ hi: "hello" })
    .send({});
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ hi: "hello" });
});

@Service()
class C {
  constructor() {}

  async a() {
    throw error("oh noes");
  }

  async b() {
    let a;
    // trigger an undefined error
    console.log(a.x);
  }
}

test("test errors", async () => {
  const app = express();
  app.use(express.json());

  let reg = new Registrator(app);

  reg.register([C]);

  let response = await await request(app)
    .post("/C/a")
    .set({ hi: "hello" })
    .send({});
  expect(response.status).toBe(500);
  expect(response.body).toEqual({ error: "oh noes" });

  response = await await request(app)
    .post("/C/b")
    .set({ hi: "hello" })
    .send({});
  expect(response.status).toBe(500);
  expect(
    JSON.stringify(response.body).includes(
      "TypeError: Cannot read properties of undefined (reading 'x')"
    )
  ).toEqual(true);
});
