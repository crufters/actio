import { expect, test } from "@jest/globals";
import { nanoid } from "nanoid";
import { getDependencyGraph, isUnexposed, Service, Unexposed } from "./reflect";

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

test("Test unexposed", async () => {
  expect(isUnexposed(H, "a")).toBe(false);
  expect(isUnexposed(H, "b")).toBe(true);
});
