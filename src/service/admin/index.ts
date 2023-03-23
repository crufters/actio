import teardown from "./teardown";

import { TeardownRequest } from "./models";

import { DataSource } from "typeorm";
import { Service } from "../../sys";
import { Servicelike } from "../../sys";

@Service()
export class AdminService implements Servicelike {
  private connection: DataSource;

  constructor(connection: DataSource) {
    this.connection = connection;
  }

  meta = {
    name: "admin",
    typeorm: {
      entities: [File],
    },
  };

  teardown(req: TeardownRequest) {
    return teardown(this.connection, req);
  }
}
