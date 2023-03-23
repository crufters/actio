/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import {
  roleAdmin,
  Token,
  TokenAdminGetRequest,
  TokenAdminGetResponse,
} from "../models";

export default async (
  connection: DataSource,
  request: TokenAdminGetRequest
): Promise<TokenAdminGetResponse> => {
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .innerJoinAndSelect("token.user", "user")
    .innerJoinAndSelect("user.roles", "role", "role.id = :id", {
      id: roleAdmin.id,
    })
    .getOne();

  return {
    token: token,
  };
};
