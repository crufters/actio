/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import {
  VerificationCodeSendRequest,
  VerificationCodeSendResponse,
  User,
  Token,
  SecretCode,
  Config,
} from "../models";
import * as sendgrid from "@sendgrid/mail";
import { Error, error } from "../../../sys";
import { nanoid } from "nanoid";
import { ConfigService } from "../../config";

// @todo
function getSendgridKey(): string {
  return "sg_key";
}

export default async (
  connection: DataSource,
  config: ConfigService,
  request: VerificationCodeSendRequest
): Promise<VerificationCodeSendResponse> => {
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .where("token.token = :id", { id: request.token })
    .getOne();
  if (!token) {
    throw error("token not found", 400);
  }

  let user: User = await connection
    .createQueryBuilder(User, "user")
    .where("user.id = :id", { id: token.userId })
    .leftJoinAndSelect("user.roles", "role")
    .leftJoinAndSelect("user.contacts", "contact")
    .getOne();

  let code = new SecretCode();
  code.id = nanoid();
  code.code = nanoid();
  code.userId = user.id;

  let c = await config.configRead({});
  if (c instanceof Error) {
    return c;
  }
  let conf: Config = c.config?.data?.AuthenticationService;

  sendgrid.setApiKey(getSendgridKey());
  const msg = {
    // @todo this only supports a single contract
    to: user.contacts[0].url, // Change to your recipient
    from: conf?.email?.from, // Change to your verified sender
    subject: conf?.email?.register?.subject || "Email confirmation",
    text:
      conf?.email?.register.text ||
      "Szia,\n\nKérünk erősítsd meg az emailedet erre a linkre kattintva:\n\nhttps://kuponjaim.hu/auth/email-verification?code=" +
        code.code +
        "\n\nA kuponjaim.hu csapata",
  };

  await connection.transaction(async (tran) => {
    await tran.save(code);
  });

  await sendgrid.send(msg);

  return {};
};
