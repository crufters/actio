/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { Secret, SecretReadResponse } from "./models.js";

export default async (
  connection: DataSource,
  request: any
): Promise<SecretReadResponse> => {
  let secret: Secret;
  try {
    secret = await connection.createQueryBuilder(Secret, "secret").getOne();
  } catch (e) {
    console.log(e);
    return {
      secret: {
        data: {},
      },
    };
  }
  if (!secret) {
    secret = {
      data: {},
    };
  }

  // Add env variables to secret for local development
  // see readme for more info
  Object.keys(process.env).forEach(function (key) {
    if (!key.startsWith("SECRET_")) {
      return;
    }
    if (!secret?.data) {
      secret.data = {};
    }
    let key2 = key
      .replace("SECRET_", "")
      .toLowerCase()
      // https://stackoverflow.com/questions/6660977/convert-hyphens-to-camel-case-camelcase
      .replace(/_([a-z])/g, function (g) {
        return g[1].toUpperCase();
      });
    secret.data[key2] = process.env[key];
  });

  return {
    secret: secret,
  };
};
