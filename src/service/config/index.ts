import { Service, Unexposed } from "../..";
import { DataSource } from "typeorm";

import configRead from "./configRead";
import configSave from "./configSave";
import configSaveS2S from "./configSaveS2S";

import {
  Config,
  Secret,
  ConfigSaveRequest,
  ConfigReadRequest,
  SecretReadRequest,
  SecretSaveRequest,
} from "./models";
import { Servicelike } from "../..";
import { AuthenticationService } from "../authentication";
import secretRead from "./secretRead";
import secretSave from "./secretSave";

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
  /** Should not be exposed over http */
  secretRead(req: SecretReadRequest) {
    return secretRead(this.connection, req);
  }

  /** Should be exposed over http but authenticated with admin */
  secretSave(req: SecretSaveRequest) {
    return secretSave(this.connection, this.depProducer, req);
  }
}
