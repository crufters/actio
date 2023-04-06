import { expect, test } from "@jest/globals";
import { nanoid } from "nanoid";
import {
  Endpoint,
  getDependencyGraph,
  isUnexposed,
  Service,
  Unexposed,
  getMethodParamsInfo,
} from "./reflect.js";

@Service()
class G {}

@Service()
class F {}

@Service()
class E {
  constructor(dep: G) {}
}

@Service()
class D {
  constructor(dep: E) {}
}

@Service()
class C {
  constructor(dep: D, dep1: F) {}
}

@Service()
class B {
  constructor() {
    this.val = 1;
    this.id = nanoid();
  }
  val: Number;
  id: string;

  onInited: boolean;
  _onInit(): any {
    this.onInited = true;
  }
}

@Service()
class A {
  b: B;
  constructor(dep: B, dep2: C) {
    this.b = dep;
  }

  onInited: boolean;
  _onInit(): any {
    this.onInited = true;
  }
}

test("Test dependency graph", async () => {
  let deps = getDependencyGraph(A);

  expect(deps.length).toBe(6);
  expect(deps[0].name).toBe("B");
  expect(deps[1].name).toBe("C");
  expect(deps[2].name).toBe("D");
  expect(deps[3].name).toBe("F");
  expect(deps[4].name).toBe("E");
  expect(deps[5].name).toBe("G");
});

@Service()
class H {
  constructor() {}

  a() {
    return 1;
  }

  @Unexposed()
  b() {
    return 2;
  }
}

test("unexposed", async () => {
  expect(isUnexposed(H, "a")).toBe(false);
  expect(isUnexposed(H, "b")).toBe(true);
});

@Service()
class I {
  constructor() {}

  @Endpoint()
  a(a: number, b: string, c: C) {
    return 1;
  }
}

test("method types", async () => {
  console.log(I);
  let inf = getMethodParamsInfo("I");
  expect(inf.length).toBe(1);
  expect(inf[0].target.constructor.name).toBe("I");
  expect(inf[0].methodName).toBe("a");
  expect(inf[0].paramNames.length).toBe(3);
  expect(inf[0].paramNames).toEqual(["_a", "b", "c"]);
  expect(inf[0].paramTypes.length).toBe(3);
  expect(inf[0].paramTypes[0]).toBe(Number);
  expect(inf[0].paramTypes[1]).toBe(String);
  expect(inf[0].paramTypes[2]).toBe(C);
  expect(inf[0].paramTypes[2].name).toBe("C");
});
