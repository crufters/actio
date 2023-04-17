import { expect, test } from "@jest/globals";

import { createApp } from "../../registrator.js";
import { Service } from "../../reflect.js";
import { default as request } from "supertest";
import { SystemService } from "./index.js";
import _ from "lodash";

@Service()
class NodeA {
  constructor() {}
}

@Service()
class NodeB {
  constructor(a: NodeA) {}
}

@Service()
class NodeC {
  constructor(b: NodeB) {}
}

test("node read", async () => {
  let randomPortNumberA = Math.floor(Math.random() * 10000) + 10000;
  let randomPortNumberB = Math.floor(Math.random() * 10000) + 10000;
  let randomPortNumberC = Math.floor(Math.random() * 10000) + 10000;

  // pass in node C because then it pulls in the other two services
  let appC = createApp([NodeC, SystemService], {
    addresses: new Map()
      .set("NodeA", `http://localhost:${randomPortNumberA}`)
      .set("NodeB", `http://localhost:${randomPortNumberB}`),
    nodeID: "1",
  });

  let appB = createApp([NodeC, SystemService], {
    addresses: new Map()
      .set("NodeA", `http://localhost:${randomPortNumberA}`)
      .set("NodeC", `http://localhost:${randomPortNumberC}`),
    nodeID: "2",
  });

  let appA = createApp([NodeC, SystemService], {
    addresses: new Map()
      .set("NodeB", `http://localhost:${randomPortNumberB}`)
      .set("NodeC", `http://localhost:${randomPortNumberC}`),
    nodeID: "3",
  });

  let serverA, serverB, serverC;
  setTimeout(() => {
    serverA = appA.listen(randomPortNumberA);
  }, 1);
  setTimeout(() => {
    serverB = appB.listen(randomPortNumberB);
  }, 1);
  setTimeout(() => {
    serverC = appC.listen(randomPortNumberC);
  }, 1);

  let response = await request(appA).post("/SystemService/nodesRead").send({
    propagate: true,
  });
  expect(response.status).toBe(200);
  expect({
    nodes: response.body.nodes.sort((a, b) => {
        if (a.id < b.id)
        return -1;
      if (a.id > b.id)
        return 1;
      return 0;
    }),
  }).toEqual({
    nodes: [
      {
        id: "1",
        services: [
          {
            name: "NodeC",
          },
          {
            name: "SystemService",
          },
          {
            address: `http://localhost:${randomPortNumberB}`,
            name: "NodeB",
          },
          {
            address: `http://localhost:${randomPortNumberA}`,
            name: "NodeA",
          },
        ],
      },
      {
        id: "2",
        services: [
          {
            address: `http://localhost:${randomPortNumberC}`,
            name: "NodeC",
          },
          {
            name: "SystemService",
          },
          {
            name: "NodeB",
          },
          {
            address: `http://localhost:${randomPortNumberA}`,
            name: "NodeA",
          },
        ],
      },
      {
        id: "3",
        services: [
          {
            address: `http://localhost:${randomPortNumberC}`,
            name: "NodeC",
          },
          {
            name: "SystemService",
          },
          {
            address: `http://localhost:${randomPortNumberB}`,
            name: "NodeB",
          },
          {
            name: "NodeA",
          },
        ],
      },
    ],
  });

  serverA.close();
  serverB.close();
  serverC.close();
});
