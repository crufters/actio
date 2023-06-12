import { expect, test, describe } from "@jest/globals";

import { Service } from "./reflect.js";
import { Entity, PrimaryColumn, Column } from "typeorm";
import { DataSource } from "typeorm";
import { nanoid } from "nanoid";
import { Injector } from "./injector.js";

@Entity()
export class E {
  @PrimaryColumn()
  id?: string;

  @Column({ nullable: true })
  something?: string;
}

@Service()
class NsA {
  meta = {
    name: "nsa",
    typeorm: {
      entities: [E],
    },
  };

  constructor(private db: DataSource) {}

  async a(): Promise<any> {
    let e = await this.db.createQueryBuilder(E, "e").getMany();
    if (e.length > 1) {
      throw new Error("too many entities");
    }
    return { hi: e[0].something };
  }

  async _onInit() {
    console.log("NsA init - should only happen once");
    this.db.transaction(async (manager) => {
      await manager.save(E, { id: "1", something: nanoid() });
    });
  }
}

@Service()
class NsB {
  constructor(private a: NsA) {}

  async b() {
    return await this.a.a();
  }
}

@Service()
class NsC {
  constructor(private a: NsA) {}

  async c() {
    return await this.a.a();
  }
}

describe("test global namespaces", () => {
  let b: NsB;
  let c: NsC;

  test("ns", async () => {
    let bNamespace = "t_" + nanoid().slice(0, 7);
    let cNamespace = "t_" + nanoid().slice(0, 7);
    let i = await new Injector([NsB, NsC]);
    i.log = true;
    i.fixedNamespaces = new Map().set("NsA", "global");
    b = await i.getInstance("NsB", bNamespace);
    c = await i.getInstance("NsC", cNamespace);

    let rspB = await b.b();
    let rspC = await c.c();
    expect(await rspB).toEqual(await rspC);
  });
});

// @todo test multinode setup
