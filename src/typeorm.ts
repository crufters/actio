import { Connector } from "./db";
import { getMeta } from "./reflect";
import { DataSource } from "typeorm";
import { MixedList, EntitySchema } from "typeorm";

/**
 * Typeorm related configuration for services that use typeorm,
 * ie. have DataSource as a dependency.
 */
export interface TypeORMMeta {
  /**
   * Call DataSource.syncronize() when the service starts?
   * Defaults to true.
   */
  syncronize?: boolean;
  /**
   * All typeorm entities that are used inside a service.
   */
  entities: MixedList<string | Function | EntitySchema<any>>;
}

/**
 * Each service has its own database in postgres,
 * so databases are both namespace and service specific,
 * ie. the database name is something like domain + serviceName,
 * or an actual example: "example-com--authentication" (this
 * is just to explain, the actual database name should not
 * matter for you, just assume you have your own database for your
 * service, in your own namespace).
 */
export class TypeORMHandler {
  public typeName = "DataSource";
  private connectorsByService: Map<string, Connector> = new Map();

  constructor() {}

  async handle(serviceClass: any, config: any): Promise<DataSource> {
    let namespace = config as string;
    // We need to acquire a per service connection
    // because we need to react to the typeormDbCreated callback
    // on a per service case - we want to call the service _onFirstInit
    // method when it happens.
    //
    // @todo this is not true anymore as _onFirstInit was retired

    if (!this.connectorsByService.has(serviceClass.name)) {
      let conn = new Connector({
        typeormDbCreated: (conn) => {
          // @todo this was left over here from the
          // time where we had _onFirstInit, we should
          // decide if we want to bring it back or not.
          // firstConnectionForThisService = true;
        },
      });
      this.connectorsByService.set(serviceClass.name, conn);
    }
    let conn = this.connectorsByService.get(serviceClass.name);

    // This assumes the constructor won't panic because the dependencies
    // are not supplied.
    let meta = getMeta(serviceClass);
    let conf = (meta as any).typeorm as TypeORMMeta;
    let connection = await conn.connect(
      namespace + "__" + serviceClass.name.toLowerCase().replace("service", ""),
      conf?.entities
    );
    return connection;
  }
}
