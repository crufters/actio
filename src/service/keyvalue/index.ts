import { DataSource } from "typeorm";
import * as m from "./models.js";
import { Servicelike } from "../../util.js";
import { Service } from "../../reflect.js";
import { AuthenticationService } from "../authentication/index.js";
import get from "./get.js";
import set from "./set.js";
import list from "./list.js";

@Service()
export class KeyValueService implements Servicelike {
  meta = {
    name: "key-value",
    typeorm: {
      entities: [m.Value],
    },
  };

  private connection: DataSource;
  private auth: AuthenticationService;

  constructor(connection: DataSource, auth: AuthenticationService) {
    this.connection = connection;
    this.auth = auth;
  }

  set(req: m.SetRequest) {
    return set(this.connection, this.auth, req);
  }

  get(req: m.GetRequest) {
    return get(this.connection, this.auth, req);
  }

  list(req: m.ListRequest) {
    return list(this.connection, this.auth, req);
  }

  async _onInit(): Promise<void> {
    return null;
  }
}
