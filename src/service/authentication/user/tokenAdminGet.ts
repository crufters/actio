import { DataSource } from "typeorm";
import {
  roleAdmin,
  Token,
  TokenAdminGetRequest,
  TokenAdminGetResponse,
} from "../models.js";

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
