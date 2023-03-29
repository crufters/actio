/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  Contact,
  Password,
  platformEmail,
  Token,
  UserLoginRequest,
  UserLoginResponse,
} from "../models.js";

const err = error("incorrect credentials", 400);

export default async (
  connection: DataSource,
  request: UserLoginRequest
): Promise<UserLoginResponse> => {
  // only email login supported for now
  let contacts = await connection
    .createQueryBuilder(Contact, "contact")
    .where("contact.url = :url AND contact.platformId = :platformId", {
      url: request.contactUrl,
      platformId: platformEmail.id,
    })
    .leftJoinAndSelect("contact.user", "user")
    .getMany();

  if (!contacts || contacts.length == 0) {
    throw error("contact not found", 400);
  }
  let contact = contacts[0];
  if (!contact.user) {
    throw error("user for contact not found", 400);
  }
  if (!contact.user.id) {
    throw err;
  }

  let passwords = await connection
    .createQueryBuilder(Password, "password")
    .where("password.userId = :id", {
      id: contact.user.id,
    })
    .getMany();
  if (!passwords || passwords.length == 0) {
    throw error("password not found", 400);
  }
  // @todo be very careful with filter and other list ops when supporting
  // multiple passwords as most ops don't support promises
  let matched = await bcrypt.compare(request.password, passwords[0].id);

  if (!matched) {
    throw error("login unsuccessful", 400);
  }
  let token = new Token();
  // @todo Even the token should be hashed so even if the database leaks
  // token ID won't be usable
  // let unhashedTokenId = nanoid();
  // token.id = await bcrypt.hash(unhashedTokenId, 10);
  token.id = nanoid();
  token.token = nanoid();
  token.userId = contact.user.id;

  await connection.getRepository(Token).save(token);

  return {
    token: token,
  };
};
