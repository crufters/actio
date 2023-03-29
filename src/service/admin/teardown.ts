

import { DataSource } from "typeorm";
import { TeardownRequest, TeardownResponse } from "./models.js";
import { Token, roleAdmin } from "../authentication/models.js";
import { error } from "../../util.js";
import { default as env } from "../../env.js";

export default async (
  connection: DataSource,
  req: TeardownRequest
): Promise<TeardownResponse> => {
  if (env.isProd) {
    throw error("can not tear down production", 400);
  }
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .where("token.token = :id", { id: req.token })
    .leftJoinAndSelect("token.user", "user")
    .leftJoinAndSelect("user.roles", "role")
    .getOne();
  if (!token) {
    throw error("token not found", 400);
  }

  let isAdmin = false;
  if (token.user.roles?.find((r) => r.id == roleAdmin.id)) {
    isAdmin = true;
  }
  if (!isAdmin) {
    throw error("not authorized", 400);
  }
  if (req.passphrase != "i-really-do-want-to-tear-it-all-down") {
    throw error("not authorized", 400);
  }
  if (connection.name == "deflt") {
    throw error("can not drop default", 400);
  }

  await connection.dropDatabase();
  await connection.synchronize();
  return {};
};
