import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  Password,
  PasswordChangeRequest,
  PasswordChangeResponse,
  SecretCode,
  Token,
  User,
} from "../models.js";

export default async (
  connection: DataSource,
  request: PasswordChangeRequest
): Promise<PasswordChangeResponse> => {
  let code: SecretCode = await connection
    .createQueryBuilder(SecretCode, "code")
    .where("code.code = :id", { id: request.code })
    .getOne();

  if (!code || !code.id) {
    throw error("code not found", 400);
  }

  if (code.used) {
    throw error("code already used", 400);
  }

  let user: User = await connection
    .createQueryBuilder(User, "user")
    .where("user.id = :id", { id: code.userId })
    .leftJoinAndSelect("user.roles", "role")
    .leftJoinAndSelect("user.contacts", "contact")
    .getOne();

  let password = new Password();
  password.id = await bcrypt.hash(request.newPassword, 10);
  password.userId = user.id;

  let token = new Token();
  token.id = nanoid();
  token.userId = user.id;
  token.token = nanoid();

  await connection.transaction(async (tran) => {
    // @todo do not delete all old passwords
    await tran
      .createQueryBuilder(SecretCode, "secret_code")
      .update(SecretCode)
      .where(`secret_code.id = :codeId`, {
        codeId: code.id,
      })
      .set({
        used: true,
      })
      .execute();

    await tran
      .createQueryBuilder(Password, "password")
      .delete()
      .where(`password."userId" = :userId`, {
        userId: user.id,
      })
      .execute();

    await tran.save(password);
    await tran.save(token);
  });

  return { token: token };
};
