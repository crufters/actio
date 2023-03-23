/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { error } from "../../../sys";
import {
  roleAdmin,
  Token,
  User,
  UserSaveRequest,
  UserSaveResponse,
} from "../models";

export default async (
  connection: DataSource,
  request: UserSaveRequest
): Promise<UserSaveResponse> => {
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .where("token.token = :id", { id: request.token })
    .getOne();
  if (!token) {
    throw error("token not found", 400);
  }

  let caller: User = await connection
    .createQueryBuilder(User, "user")
    .where("user.id = :id", { id: token.userId })
    .leftJoinAndSelect("user.roles", "role")
    .getOne();

  let user = new User(request.user);
  user.id = caller.id;

  let isAdmin = false;
  if (caller.roles?.find((r) => r.id == roleAdmin.id)) {
    isAdmin = true;
  }

  // @todo allow admins to update roles maybe?
  delete user.roles;

  // only allow admins to update others
  if (!isAdmin && caller.id != user.id) {
    throw error("not permitted", 400);
  }

  await connection.transaction(async (tran) => {
    await tran.save(user);
  });

  return { user: user };
};
