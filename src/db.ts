/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import {
  DataSource,
  DataSourceOptions,
  MixedList,
  EntitySchema,
} from "typeorm";

import env from "./env.js";

let defaultConnectionOptions: DataSourceOptions = {
  name: "deflt",
  type: "postgres",
  host: env.postgres.connectionName,
  username: env.postgres.dbUser,
  password: env.postgres.dbPassword,
  database: env.postgres.dbName,
  // logging: true,
  synchronize: true,
};

interface ConnectorCallbacks {
  /** Invoked right after the database is created ie.
   * after the CREATE DATABASE command.
   */
  typeormDbCreated?: (conn: DataSource) => void;
  /** Invoked right after connecting to the database.
   */
  typeormConnectionInitialized?: (conn: DataSource) => void;
}

/** Connector manages database connections.
 */
export class Connector {
  log = false;
  private connections: Map<string, DataSource> = new Map();
  private callbacks: ConnectorCallbacks = {};

  constructor(callbacks: ConnectorCallbacks) {
    this.callbacks = callbacks;
  }

  /** Connect to a postgres database and return
   * a typeorm connection.
   * It creates databases if they don't exist.
   */
  public connect = async (
    namespace: string,
    entities: MixedList<string | Function | EntitySchema<any>>
  ): Promise<DataSource> => {
    let finalNamespace = namespace
      .replace(".", "_")
      .replace("-", "_")
      .toLowerCase();
    if (this.connections.has(finalNamespace)) {
      return this.connections.get(finalNamespace);
    }

    let copts: DataSourceOptions = {
      ...defaultConnectionOptions,
      name: finalNamespace as any,
      database: finalNamespace as any,
      entities: entities,
    };

    let connection: DataSource;

    try {
      connection = await this.connectTo(copts);
    } catch (err) {
      // is it a database not exist error?
      if (err.toString().includes("does not exist")) {
        // connect to the default database to create the other databases
        let c = await this.connectTo(defaultConnectionOptions);
        try {
          this.log && console.log("creating database", finalNamespace);
          await c.query("CREATE DATABASE " + finalNamespace);
          this.log && console.log("created database", finalNamespace);
          //await sleep(100);
        } catch (e) {
          this.log && console.log(e);
        }
        connection = await this.connectTo(copts);
        if (this.callbacks?.typeormDbCreated != undefined) {
          this.callbacks.typeormDbCreated(connection);
        }
      } else {
        throw err;
      }
    }
    return connection;
  };

  // connect to the default database
  private connectTo = async (
    connOpts: DataSourceOptions
  ): Promise<DataSource> => {
    let dbName = connOpts.database as string;
    let connection = new DataSource(connOpts);

    if (!connection.isInitialized) {
      connection = await connection.initialize();
      if (this.callbacks?.typeormConnectionInitialized != undefined) {
        this.callbacks?.typeormConnectionInitialized(connection);
      }
      this.connections.set(dbName, connection);
    }

    return connection;
  };
}

//function sleep(ms) {
//  return new Promise((resolve) => {
//    setTimeout(resolve, ms);
//  });
//}
