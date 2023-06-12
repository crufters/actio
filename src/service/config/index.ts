import { Service, Unexposed } from "../../reflect.js";
import { DataSource } from "typeorm";

import configRead from "./configRead.js";
import configSave from "./configSave.js";
import configSaveS2S from "./configSaveS2S.js";
import secretSaveS2S from "./secretSaveS2S.js";

import {
  Config,
  Secret,
  ConfigSaveRequest,
  ConfigReadRequest,
  SecretReadRequest,
  SecretSaveRequest,
} from "./models.js";
import { Servicelike } from "../../util.js";
import { AuthenticationService } from "../authentication/index.js";
import secretRead from "./secretRead.js";
import secretSave from "./secretSave.js";

@Service()
export class ConfigService implements Servicelike {
  meta = {
    name: "config",
    typeorm: {
      entities: [Config, Secret],
    },
  };

  private connection: DataSource;
  /** depProducer pattern is used here to get around circular
   * dependencies. The AuthenticationService depends on the
   * ConfigService, and the ConfigService depends on the
   * AuthenticationService. This is a workaround for that.
   */
  private depProducer: (serviceName: string) => Promise<AuthenticationService>;

  constructor(
    connection: DataSource,
    depProducer: (serviceName: string) => Promise<AuthenticationService>
  ) {
    this.connection = connection;
    this.depProducer = depProducer;
  }

  configRead(req: ConfigReadRequest) {
    return configRead(this.connection, req);
  }

  configSave(req: ConfigSaveRequest) {
    return configSave(this.connection, this.depProducer, req);
  }

  @Unexposed()
  configSaveS2S(req: ConfigSaveRequest) {
    return configSaveS2S(this.connection, req);
  }

  @Unexposed()
  secretSaveS2S(req: SecretSaveRequest) {
    return secretSaveS2S(this.connection, req);
  }

  @Unexposed()
  /** Should not be exposed over http */
  secretRead(req: SecretReadRequest) {
    return secretRead(this.connection, req);
  }

  /** Should be exposed over http but authenticated with admin */
  secretSave(req: SecretSaveRequest) {
    return secretSave(this.connection, this.depProducer, req);
  }
}
