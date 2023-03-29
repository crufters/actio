/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { error } from "../../util.js";
import { roleAdmin } from "../authentication/models.js";
import { AuthenticationService } from "../authentication/index.js";
import { ConfigSaveRequest, ConfigSaveResponse } from "./models.js";
import configSaveS2S from "./configSaveS2S.js";

export default async (
  connection: DataSource,
  depProducer: (serviceName: string) => Promise<AuthenticationService>,
  request: ConfigSaveRequest
): Promise<ConfigSaveResponse> => {
  let auth = await depProducer("AuthenticationService");
  let token = await auth.tokenRead({
    token: request.token,
  });
  if (token.token.user.roles.find((r) => r.id == roleAdmin.id) == undefined) {
    throw error("not authorized", 400);
  }
  return configSaveS2S(connection, request);
};
