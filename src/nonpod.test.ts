import { expect, test } from "@jest/globals";

import { Injector } from "./injector.js";
import { Service } from "./reflect.js";

@Service()
class NonPod {
  constructor() {}

  async date() {
    return { date: new Date() };
  }
}

@Service()
class NonPodProxy {
  nonPod: NonPod;
  constructor(nonPod: NonPod) {
    this.nonPod = nonPod;
  }

  async dateProxy() {
    let rsp = await this.nonPod.date();
    if (rsp.date instanceof Date) {
      throw "non pod types should be serialized";
    }
    return rsp;
  }
}

// non pod types should be serialized
test("non pod types", async () => {
  let i = new Injector([NonPodProxy]);
  let nonPodProxy: NonPodProxy = await i.getInstance(
    "NonPodProxy",
    "non-pod-types"
  );
  let rsp = await nonPodProxy.dateProxy();
  expect(rsp.date instanceof Date).toBe(false);

  i = new Injector([NonPod]);
  let nonPod: NonPod = await i.getInstance("NonPod", "non-pod-types");
  rsp = await nonPod.date();
  expect(rsp.date instanceof Date).toBe(false);
});
