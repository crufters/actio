/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  Contact,
  SecretCode,
  User,
  VerificationCodeVerifyRequest,
  VerificationCodeVerifyResponse,
} from "../models.js";

export default async (
  connection: DataSource,
  request: VerificationCodeVerifyRequest
): Promise<VerificationCodeVerifyResponse> => {
  let code: SecretCode = await connection
    .createQueryBuilder(SecretCode, "code")
    .where("code.code = :id", { id: request.code })
    .getOne();

  if (!code || !code.id) {
    throw error("code not found", 400);
  }

  let user: User = await connection
    .createQueryBuilder(User, "user")
    .where("user.id = :id", { id: code.userId })
    .leftJoinAndSelect("user.contacts", "contact")
    .getOne();

  if (code.userId != user.id) {
    throw error("code is wrong", 400);
  }

  await connection.transaction(async (tran) => {
    await tran
      .createQueryBuilder(Contact, "contact")
      .update(Contact)
      .where(`contact.url = :url AND contact."platformId" = :platform`, {
        url: user.contacts[0].url,
        platform: user.contacts[0].platformId,
      })
      .set({
        verified: true,
      })
      .execute();
  });

  return {};
};
