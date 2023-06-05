import { test, expect, describe } from "@jest/globals";
import { nanoid } from "nanoid";
import { Service, Injector } from "@crufters/actio";
import { DataSource, Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class KV {
  @PrimaryColumn()
  id?: string;

  @Column()
  value?: string;
}

interface SetRequest {
  key?: string;
  value?: string;
}

interface GetRequest {
  key?: string;
}

interface GetResponse {
  value?: string;
}

@Service()
class MyService {
  meta = {
    typeorm: {
      entities: [KV],
    },
  };
  constructor(private db: DataSource) {}

  // this method will be exposed as an HTTP endpoint
  async set(req: SetRequest) {
    await this.db
      .createEntityManager()
      .save(KV, { id: req.key, value: req.value });
  }

  async get(req: GetRequest): Promise<GetResponse> {
    let v = await this.db
      .createQueryBuilder(KV, "kv")
      .where("kv.id = :id", { id: req.key })
      .getOne();
    return { value: v?.value };
  }
}

describe("my test", () => {
  var myService: MyService;

  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let i = new Injector([MyService]);
    myService = await i.getInstance("MyService", namespace);
  });

  test("set get test", async () => {
    await myService.set({ key: "testkey", value: "testvalue" });
    let rsp = await myService.get({ key: "testkey" });
    expect(rsp.value).toBe("testvalue");
  });
});
