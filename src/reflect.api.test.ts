//import { getAPIJSON } from "./reflect.api.js";
import { Field } from "./reflect.field.js";
import { Service } from "./reflect.js";
import { Endpoint } from "./reflect.js";
import { test } from "@jest/globals";

class M {
  @Field()
  ID: string;

  @Field()
  name?: string;

  @Field()
  age: number;
}

@Service()
class N {
  constructor() {}

  @Endpoint({
    returns: null,
  })
  async doSomething(req: M): Promise<void> {}
}

test("api def", async () => {
  console.log(N);
  //let api = getAPIJSON();
  //api.services.N.doSomething.params[0].typeName = "M";
});
