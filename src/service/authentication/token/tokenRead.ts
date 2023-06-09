import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import { Token, TokenReadRequest, TokenReadResponse } from "../models.js";

export default async (
  connection: DataSource,
  req: TokenReadRequest
): Promise<TokenReadResponse> => {
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .where("token.token = :id", { id: req.token })
    .leftJoinAndSelect("token.user", "user")
    .leftJoinAndSelect("user.roles", "role")
    .leftJoinAndSelect("user.contacts", "contact")
    .leftJoinAndSelect("contact.platform", "platform")
    //.leftJoinAndSelect("user.thumbnail", "thumbnail")
    .leftJoinAndSelect("user.departments", "department")
    .leftJoinAndSelect("department.organization", "organization")
    //.leftJoinAndSelect("organization.thumbnail", "orgthumbnail")
    .getOne();
  if (!token) {
    throw error("token not found", 400);
  }

  return {
    token: token,
  };
};
