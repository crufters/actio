import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import {
  Token,
  User,
  Password,
  Contact,
  UserUnGhostRequest,
  UserUnGhostResponse,
  platformEmail,
} from "../models.js";

export default async (
  connection: DataSource,
  request: UserUnGhostRequest
): Promise<UserUnGhostResponse> => {
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .where("token.token = :id", { id: request.token })
    .leftJoinAndSelect("token.user", "user")
    .getOne();
  if (!token) {
    throw error("token not found", 400);
  }

  let user = new User();
  user.id = token.user.id;

  let password = new Password();
  let contact = new Contact();
  contact.id = nanoid();
  contact.platformId = platformEmail.id;
  contact.userId = user.id;
  contact.url = request.contact.url;

  password.id = await bcrypt.hash(request.password, 10);
  password.userId = user.id;

  await connection.transaction(async (tran) => {
    await tran.save(password);
    await tran.save(contact);
  });

  return { user: user };
};
