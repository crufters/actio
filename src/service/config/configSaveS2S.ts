/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

//import { nanoid } from "nanoid";
import { DataSource } from "typeorm";
import { copy } from "../../sys";
import { Config, ConfigSaveRequest, ConfigSaveResponse } from "./models";

export default async (
  connection: DataSource,
  request: ConfigSaveRequest
): Promise<ConfigSaveResponse> => {
  let dbConfig: Config;
  try {
    dbConfig = await connection.createQueryBuilder(Config, "config").getOne();
  } catch (e) {
    console.log(e);
    return {
      config: {},
    };
  }
  if (!dbConfig) {
    dbConfig = {
      data: {},
    };
  }

  let config = new Config();
  let result = mergeDeep(config, dbConfig, request.config);
  copy(result, config);
  if (!config.id) {
    config.id = "1";
  }

  await connection.transaction(async (tran) => {
    await tran.save(config);
  });

  return {
    config: config,
  };
};

// taken from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
