/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import {
  User,
  Contact,
  Token,
  Password,
  UserRegisterRequest,
  UserRegisterResponse,
  platformEmail,
  roleUser,
} from "../models";
import { nanoid } from "nanoid";
import * as slug from "slug";
import * as bcrypt from "bcrypt";
import { error } from "../../../sys";
// import verificationCodeSend from "./verificationCodeSend";
import userLogin from "./userLogin";
import { ConfigService } from "../../config";

export default async (
  connection: DataSource,
  config: ConfigService,
  request: UserRegisterRequest
): Promise<UserRegisterResponse> => {
  let userId = nanoid();
  let user = new User();

  let password = new Password();
  let contact = new Contact();
  let conf = await config.configRead({});

  if (!request.ghostRegister) {
    if (!request.user) {
      throw error("missing user", 400);
    }

    // check if user exists
    if (!request.user?.contacts) {
      throw error("missing contact", 400);
    }

    let cont = request.user.contacts[0];

    if (
      conf.config.isProduction &&
      cont.platformId == platformEmail.id &&
      cont.url.includes("+")
    ) {
      throw error(
        "email address cannot contain '+' in a production environment. " +
          "if this is a local environment set the config `isProduction` to false, because it is true for some reason. ",
        400
      );
    }

    let existingContacts: Contact[] = await connection
      .createQueryBuilder(Contact, "contact")
      .where(`contact."platformId" = :platformId AND contact.url = :url`, {
        platformId: platformEmail.id,
        url: cont.url,
      })
      .getMany();

    if (existingContacts?.length > 0) {
      // @todo maybe we should just throw an error here
      let rsp = await userLogin(connection, {
        contactUrl: cont.url,
        password: request.password,
      });
      return rsp;
    }

    let contactId = nanoid();
    contact.id = contactId;
    contact.platformId = platformEmail.id;
    contact.url = cont.url;
    contact.verified = false;
    contact.userId = userId;

    password.id = await bcrypt.hash(request.password, 10);
    password.userId = userId;
  } else {
    user.ghost = true;
    user.slug = "ghost-" + nanoid();
  }

  user.id = userId;
  if (request.user) {
    user.slug = request.user.slug ? slug(request.user.slug) : userId;
    user.fullName = request.user.fullName;
    user.gender = request.user.gender;
    user.location = request.user.location;
    user.address = request.user.address;
  }

  user.roles = [roleUser];

  let token = new Token();
  // @todo Even the token id will be hashed so even if the database leaks
  // token ID won't be usable
  // let unhashedTokenId = nanoid();
  // token.id = await bcrypt.hash(unhashedTokenId, 10);
  token.id = nanoid();
  token.userId = userId;
  token.token = nanoid();

  await connection.transaction(async (tran) => {
    // roles will be saved (created even)
    // due to the cascade option, see the model
    await tran.save(user);
    if (!request.ghostRegister) {
      await tran.save(password);
      await tran.save(contact);
    }
    await tran.save(token);
  });

  //if (!cont.url.includes(ownerDomain())) {
  //  await verificationCodeSend(connection, config, {
  //    token: token.token,
  //  });
  //}

  return {
    token: token,
  };
};
