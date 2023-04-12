import { Service } from "../../reflect.js";
import { DataSource } from "typeorm";

import apiRead from "./apiRead.js";

import { Servicelike } from "../../util.js";

interface ApiReadRequest {}

@Service()
export class SystemService implements Servicelike {
  meta = {
    name: "system",
  };

  private connection: DataSource;

  constructor(connection: DataSource) {
    this.connection = connection;
  }

  apiRead(req: ApiReadRequest) {
    return apiRead(this.connection, req);
  }
}
