import { expect, test } from "@jest/globals";
import { Field, listClasses, listFields } from "./reflect.field.js";

class J {
  constructor() {}

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
  constructor() {}

  @Field()
  a: J[];
}

test("array field", async () => {
  console.log(K);
  let fields = listFields("K");
  expect(fields.length).toBe(1);
  expect(fields[0].target.constructor.name).toBe("K");
    expect(fields[0].name).toBe("a");
    expect(fields[0].type).toBe(Array);
    

});
