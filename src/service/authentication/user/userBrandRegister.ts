/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import slug from "slug";
import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  Contact,
  Department,
  Organization,
  Password,
  platformEmail,
  roleBusiness,
  roleUser,
  Token,
  User,
  UserBrandRegisterRequest,
  UserBrandRegisterResponse,
  roles,
  Config,
} from "../models.js";

import { ConfigService } from "../../config/index.js";
// import verificationCodeSend from "./verificationCodeSend";

export default async (
  connection: DataSource,
  config: ConfigService,
  request: UserBrandRegisterRequest,
  defaultConfig: Config
): Promise<UserBrandRegisterResponse> => {
  if (!request.user) {
    throw error("missing user", 400);
  }
  if (!request.password) {
    throw error("missing password", 400);
  }
  // check if user exists
  if (!request.user?.contacts) {
    throw error("missing contact", 400);
  }

  let cont = request.user.contacts[0];

  let existingContacts: Contact[] = await connection
    .createQueryBuilder(Contact, "contact")
    .where("contact.platformId = :platformId AND contact.url = :url", {
      platformId: platformEmail.id,
      url: cont.url,
    })
    .getMany();
  if (existingContacts?.length > 0) {
    throw error("user already exists", 400);
  }

  let userId = nanoid();
  let user = new User();
  user.id = userId;
  user.fullName = request.user.fullName;
  user.slug = request.user.slug ? slug(request.user.slug) : slug(user.fullName);
  // user.gender = request.user.gender;
  // user.birthDay = request.user.age;
  user.location = request.user.location;

  let contact = new Contact();

  let contactId = nanoid();
  contact.id = contactId;
  contact.platformId = platformEmail.id;
  contact.url = cont.url;
  contact.verified = false;
  contact.userId = userId;

  let cf = await config.configRead({});

  // crazy hack. this should use verified emails
  // belonging to a company domain to detect adminship
  if (
    request.password == defaultConfig.adminPassword ||
    cf.config?.data?.AuthenticationService?.adminPassword
  ) {
    user.roles = roles;
  } else {
    user.roles = [roleBusiness, roleUser];
  }

  let token = new Token();
  // @todo Even the token id will be hashed so even if the database leaks
  // token ID won't be usable
  // let unhashedTokenId = nanoid();
  // token.id = await bcrypt.hash(unhashedTokenId, 10);
  token.id = nanoid();
  token.userId = userId;
  token.token = nanoid();

  let password = new Password();
  password.id = await bcrypt.hash(request.password, 10);
  password.userId = userId;

  // @todo check if organization exists,
  // we don't want the user to overwrite existing organizations with an upsert
  // @security
  let organization = new Organization();
  organization.id = nanoid();
  organization.name = request.organization.name;
  organization.slug = slug(request.organization.name);

  // create the first department
  let department = new Department();
  department.id = nanoid();
  department.name = "Department #1";
  department.organizationId = organization.id;
  department.slug = slug(department.name);
  department.balance = 0;

  user.departments = [department];

  await connection.transaction(async (tran) => {
    // roles will be saved (created even)
    // due to the cascade option, see the model
    await tran.save(organization);
    await tran.save(user);
    await tran.save(password);
    await tran.save(contact);
    await tran.save(token);
  });
  // token.id = unhashedTokenId;

  //await verificationCodeSend(connection, config, {
  //  token: token.token,
  //});

  return {
    token: token,
  };
};
