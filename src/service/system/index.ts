import { Endpoint, Service } from "../../reflect.js";

import apiRead from "./apiRead.js";
import nodesRead from "./nodesRead.js";
import { NodesReadResponse } from "./models.js";

import { Servicelike } from "../../util.js";
import { Injector } from "../../injector.js";

interface ApiReadRequest {}

@Service()
export class SystemService implements Servicelike {
  meta = {
    name: "system",
  };

  private injector: Injector;

  constructor(injector: Injector) {
    this.injector = injector;
  }

  apiRead(req: ApiReadRequest) {
    return apiRead(req);
  }

  @Endpoint({
    returns: NodesReadResponse,
  })
  async nodesRead(req: any) {
    return nodesRead(this.injector, req);
  }
}
