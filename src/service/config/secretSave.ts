/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { error } from "../../sys";
import { copy } from "../../sys";
import { roleAdmin } from "../authentication/models";
import { AuthenticationService } from "../authentication";
import { Secret, SecretSaveRequest, SecretSaveResponse } from "./models";
import { mergeDeep } from "./configSaveS2S";

export default async (
  connection: DataSource,
  depProducer: (serviceName: string) => Promise<AuthenticationService>,
  request: SecretSaveRequest
): Promise<SecretSaveResponse> => {
  let auth = await depProducer("AuthenticationService");
  let token = await auth.tokenRead({
    token: request.token,
  });
  if (token.token.user.roles.find((r) => r.id == roleAdmin.id) == undefined) {
    throw error("not authorized", 400);
  }
  let dbSecret: Secret;
  try {
    dbSecret = await connection.createQueryBuilder(Secret, "secret").getOne();
  } catch (e) {
    console.log(e);
    return {
      secret: {},
    };
  }
  if (!dbSecret) {
    dbSecret = {
      data: {},
    };
  }

  let secret = new Secret();
  let result = mergeDeep(secret, dbSecret, request.secret);
  copy(result, secret);
  if (!secret.id) {
    secret.id = "1";
  }

  await connection.transaction(async (tran) => {
    await tran.save(secret);
  });

  return {
    secret: secret,
  };
};
