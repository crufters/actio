import { Service } from "../../reflect.js";
import { DataSource } from "typeorm";

import apiRead from "./apiRead.js";
import nodesRead from "./nodesRead.js";

import { Servicelike } from "../../util.js";
import { Injector } from "../../injector.js";

interface ApiReadRequest {}

@Service()
export class SystemService implements Servicelike {
  meta = {
    name: "system",
  };

  private connection: DataSource;
  private injector: Injector;

  constructor(connection: DataSource, injector: Injector) {
    this.connection = connection;
    this.injector = injector;
  }

  apiRead(req: ApiReadRequest) {
    return apiRead(this.connection, req);
  }

  async nodesRead(req: any) {
    return nodesRead(this.injector, req);
  }
}
