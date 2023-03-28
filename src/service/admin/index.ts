import teardown from "./teardown.js";

import { TeardownRequest } from "./models.js";

import { DataSource } from "typeorm";
import { Service } from "../../reflect.js";
import { Servicelike } from "../../util.js";

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
