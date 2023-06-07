import { DataSource } from "typeorm";
import {
  User,
  Contact,
  Token,
  Password,
  UserRegisterRequest,
  UserRegisterResponse,
  platformEmail,
  Secret,
  roleAdmin,
} from "../models.js";
import { nanoid } from "nanoid";
import slug from "slug";
import * as bcrypt from "bcrypt";
import { error } from "../../../util.js";
// import verificationCodeSend from "./verificationCodeSend";
import userLogin from "./userLogin.js";
import { ConfigService } from "../../config/index.js";

export default async (
  connection: DataSource,
  config: ConfigService,
  request: UserRegisterRequest,
  defaultConfig: Secret
): Promise<UserRegisterResponse> => {
  let userId = nanoid();
  let user = new User();

  let password = new Password();
  let contact = new Contact();
  let conf = await config.configRead({});

  if (!request.ghostRegister) {
    if (!request.password) {
      throw error("missing password", 400);
    }

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

    if (!isValidEmail(cont.url)) {
      throw error("invalid email address", 400);
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
    var slugable = request.user.slug || request.user.fullName || user.id;
    user.slug = slug(slugable);
    user.fullName = request.user.fullName;
    user.gender = request.user.gender;
    user.location = request.user.location;
    user.address = request.user.address;
  }

  let sc = await config.secretRead({});
  // hack
  if (
    (defaultConfig.adminPassword &&
      request.password == defaultConfig.adminPassword) ||
    (sc.secret?.data?.AuthenticationService?.adminPassword &&
      request.password == sc.secret.data?.AuthenticationService?.adminPassword)
  ) {
    user.roles = [roleAdmin];
  }

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

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
