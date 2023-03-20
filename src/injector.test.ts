import { Injector } from "./injector";
import { Service } from "./reflect";
import { expect, test } from "@jest/globals";
import { nanoid } from "nanoid";
import { random } from "lodash";

/** @todo test for circular dependencies */

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
  id: string;
  constructor(dep: B) {
    this.b = dep;
    this.id = nanoid();
  }

  onInited: boolean;
  _onInit(): any {
    this.onInited = true;
  }
}

test("Injects deps", async () => {
  let i = new Injector([A, B]);
  let aInstance: A = await i.getInstance("A", "inject-deps");
  expect(aInstance.b?.val).toBe(1);
});

test("Injects deps multiple times", async () => {
  let i = new Injector([A, B]);
  let aInstance: A = await i.getInstance("A", "inject-deps-multiple-times");
  expect(aInstance.b?.val).toBe(1);

  aInstance = await i.getInstance("A", "inject-deps-multiple-times");
  expect(aInstance.b?.val).toBe(1);
});

test("Reuses deps", async () => {
  let i = new Injector([A, B]);
  let aInstance: A = await i.getInstance("A", "reuse-deps");
  let aInstance2: A = await i.getInstance("A", "reuse-deps");
  expect(aInstance.b?.id == aInstance2.b.id).toBe(true);
});

test("Class list is available immediately", async () => {
  let i = new Injector([A, B]);
  let list = i.availableClassNames();
  expect(list).toStrictEqual(["A", "B"]);
});

test("Class list is available immediately - implicit list", async () => {
  let i = new Injector([A]);
  let list = i.availableClassNames();
  expect(list).toStrictEqual(["A", "B"]);
});

@Service()
class C {
  constructor() {}
}

test("Depless class works", async () => {
  let i = new Injector([C]);
  let cInstance: A = await i.getInstance("C", "depless-class-works");
  expect(cInstance != undefined).toBe(true);
});

test("Oninit gets called for top level type", async () => {
  let i = new Injector([A, B]);
  let aInstance: A = await i.getInstance(
    "A",
    "oninit-gets-called-for-top-level-type"
  );
  expect(aInstance.onInited).toBe(true);
});

test("Oninit gets called for second level type", async () => {
  let i = new Injector([A, B]);
  let bInstance: A = await i.getInstance(
    "B",
    "oninit-gets-called-for-second-level-type"
  );
  expect(bInstance.onInited).toBe(true);
});

test("Oninit gets called for second level type - implicit list", async () => {
  let i = new Injector([A]);
  let bInstance: A = await i.getInstance(
    "B",
    "oninit-gets-called-for-second-level-type-implicit-list"
  );
  expect(bInstance.onInited).toBe(true);
});

test("deps are loaded without explicitly passing them in (implicit list)", async () => {
  let i = new Injector([A]);
  let bInstance: A = await i.getInstance(
    "B",
    "deps-are-loaded-without-explicitly-passing-them-in-implicit-list"
  );
  expect(bInstance.onInited).toBe(true);
});

let counter = 0;

@Service()
class D {
  constructor() {}

  onInited: boolean;
  _onInit(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        counter++;
        resolve();
      }, random(500, 1800));
    });
  }
}

@Service()
class E {
  d: D;
  constructor(dep: D) {
    this.d = dep;
  }

  onInited: boolean;
  _onInit(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, random(500, 1800));
    });
  }
}

test("Init only happens once", async () => {
  let i = new Injector([E]);
  i.log = false;

  // we make two request to the same type, but the init should only happen once
  // we make these requests in parallel
  let dInstance: Promise<D> = i.getInstance("D", "init-once");
  let d1Instance: Promise<D> = i.getInstance("D", "init-once");

  dInstance.then((e) => {
    expect(counter).toBe(1);
  });

  d1Instance.then((e) => {
    expect(counter).toBe(1);
  });

  await i.getInstance("D", "init-once");
  expect(counter).toBe(1);
});

test("Service instances are namespaced", async () => {
  let i = new Injector([A]);
  // we make two request to the same type, but the init should only happen once
  // we make these requests in parallel
  let bInstance: B = await i.getInstance("B", "ns1");
  let bInstance1: B = await i.getInstance("B", "ns2");
  expect(bInstance.id != bInstance1.id).toBe(true);

  let aInstance: A = await i.getInstance("A", "ns1");
  let aInstance1: A = await i.getInstance("A", "ns2");
  expect(aInstance.id != aInstance1.id).toBe(true);
  expect(aInstance.b.id != aInstance1.b.id).toBe(true);
  expect(aInstance.b.id == bInstance.id).toBe(true);
  expect(aInstance1.b.id == bInstance1.id).toBe(true);
});

test("Not found", async () => {
  let i = new Injector([A]);
  try {
    await i.getInstance("D", "not-found");
  } catch (e) {
    console.log(e);
    expect(JSON.stringify(e).includes("injector cannot find D")).toBe(true);
  }
});

@Service()
class F {
  cname = "F";
  constructor() {}
}

@Service()
class G {
  cname = "G";
  constructor() {}
}

@Service()
class H {
  f: F;
  g: G;

  fProducer: (serviceName: string) => Promise<F>;
  gProducer: (serviceName: string) => Promise<G>;
  constructor(
    f: (serviceName: string) => Promise<F>,
    g: (serviceName: string) => Promise<G>
  ) {
    this.fProducer = f;
    this.gProducer = g;
  }

  async _onInit() {
    this.f = await this.fProducer("F");
    this.g = await this.gProducer("G");
  }
}

test("Function based injection", async () => {
  // not how we pass in the producers
  let i = new Injector([F, G, H]);
  let h = await i.getInstance("H", "function-based-injection");
  expect(h.f?.cname).toBe("F");
  expect(h.g?.cname).toBe("G");
});
