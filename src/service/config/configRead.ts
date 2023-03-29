/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { Config, ConfigReadResponse } from "./models.js";

export default async (
  connection: DataSource,
  request: any
): Promise<ConfigReadResponse> => {
  let config: Config;
  try {
    config = await connection.createQueryBuilder(Config, "config").getOne();
  } catch (e) {
    console.log(e);
    return {
      config: {
        data: {},
      },
    };
  }
  if (!config) {
    config = {
      data: {},
    };
  }

  // Add env variables to config for local development
  // see readme for more info
  Object.keys(process.env).forEach(function (key) {
    if (!key.startsWith("CONFIG_")) {
      return;
    }
    if (!config?.data) {
      config.data = {};
    }
    let key2 = key
      .replace("CONFIG_", "")
      .toLowerCase()
      // https://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase
      .replace(/_([a-z])/g, function (g) {
        return g[1].toUpperCase();
      });
    config.data[key2] = process.env[key];
  });

  return {
    config: config,
  };
};
