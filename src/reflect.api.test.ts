import { getAPIJSON } from "./reflect.api.js";
import { Field, Param } from "./reflect.field.js";
import { Service } from "./reflect.js";
import { Endpoint } from "./reflect.js";
import { expect, test } from "@jest/globals";

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

  @Endpoint({
    returns: M,
  })
  async doSomethingElse(@Param({ type: M }) req: M[]): Promise<M> {
    return null;
  }
}

test("api def", async () => {
  console.log(N);
  let api = getAPIJSON();
  let json = {
    services: {
      N: api.services.N,
    },
    types: {
      M: api.types.M,
    },
  };
  expect(JSON.parse(JSON.stringify(json))).toEqual({
    services: {
      N: {
        doSomething: {
          info: {
            methodName: "doSomething",
            options: {
              returns: null,
            },
            paramNames: ["_x"],
            paramTypes: ["M"],
          },
          paramOptions: [{}],
        },
        doSomethingElse: {
          info: {
            methodName: "doSomethingElse",
            options: {
              returns: "M",
            },
            paramNames: ["_x2"],
            paramTypes: ["Array"],
          },
          paramOptions: [
            {
              type: "M",
            },
          ],
        },
      },
    },
    types: {
      M: {
        ID: {
          data: { name: "ID", type: "String" },
        },
        name: {
          data: { name: "name", type: "String" },
        },
        age: {
          data: { name: "age", type: "Number" },
        },
      },
    },
  });
});
