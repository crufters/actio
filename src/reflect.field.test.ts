import { expect, test } from "@jest/globals";
import { Field, listClasses, listFields, Param } from "./reflect.field.js";
import { getMethodsForService, Service } from "./reflect.js";
import { Endpoint } from "./reflect.js";

class J {
  @Field()
  a: number;

  @Field()
  b: string;
}

test("field", async () => {
  console.log(J);
  let fields = listFields("J");
  expect(fields.length).toBe(2);
  expect(fields[0].target.constructor.name).toBe("J");
  expect(fields[0].name).toBe("a");
  expect(fields[0].type).toBe(Number);
  expect(fields[1].target.constructor.name).toBe("J");
  expect(fields[1].name).toBe("b");
  expect(fields[1].type).toBe(String);

  let classes = listClasses();
  expect(classes.find((c) => c.name == "J")).toBeTruthy();
});

class K {
  @Field({ arrayOf: J })
  a: J[];
}

test("array field", async () => {
  console.log(K);
  let fields = listFields("K");
  expect(fields.length).toBe(1);
  expect(fields[0].target.constructor.name).toBe("K");
  expect(fields[0].name).toBe("a");
  expect(fields[0].type).toBe(Array);
  expect(fields[0].arrayOf).toBe(J);

  let classes = listClasses();
  expect(classes.find((c) => c.name == "K")).toBeTruthy();
});

@Service()
class L {
  constructor() {}

  @Endpoint({
    returns: J,
  })
  async doSomething(req: K): Promise<J> {
    return { a: 1, b: "2" };
  }

  @Endpoint({
    returns: K,
  })
  async doSomething2(@Param({ type: J }) req: J[]): Promise<K> {
    return { a: [{ a: 1, b: "2" }] };
  }
}

test("walk tree", async () => {
  console.log(L);
  let methods = getMethodsForService("L");
  expect(methods.length).toBe(2);
  expect(methods).toEqual([
    {
      target: L,
      methodName: "doSomething",
      paramNames: ["_x"], // ?
      paramTypes: [K],
      returnType: Promise,
      options: {
        returns: J,
      },
    },
    {
      target: L,
      methodName: "doSomething2",
      paramNames: ["_x2"], // ?
      paramTypes: [Array],
      returnType: Promise,
      options: {
        returns: K,
      },
    },
  ]);
});
