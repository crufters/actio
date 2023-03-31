import * as bcrypt from "bcrypt";
import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  Contact,
  Password,
  PasswordChangeWithOldRequest,
  PasswordChangeWithOldResponse,
  platformEmail,
} from "../models.js";

const err = error("incorrect credentials", 400);

export default async (
  connection: DataSource,
  request: PasswordChangeWithOldRequest
): Promise<PasswordChangeWithOldResponse> => {
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
    return err;
    throw error("contact not found", 400);
  }
  let contact = contacts[0];
  if (!contact.user) {
    return err;
    throw error("user for contact not found", 400);
  }
  if (!contact.user.id) {
    return err;
  }

  let passwords = await connection
    .createQueryBuilder(Password, "password")
    .where("password.userId = :id", {
      id: contact.user.id,
    })
    .getMany();
  if (!passwords || passwords.length == 0) {
    return err;
    throw error("password not found", 400);
  }
  // @todo be very careful with filter and other list ops when supporting
  // multiple passwords as most ops don't support promises
  let matched = await bcrypt.compare(request.oldPassword, passwords[0].id);

  if (!matched) {
    return err;
    throw error("login unsuccessful", 400);
  }

  let password = new Password();
  password.id = await bcrypt.hash(request.newPassword, 10);
  password.userId = contact.user.id;

  await connection.transaction(async (tran) => {
    // @todo do not delete all old passwords
    await tran
      .createQueryBuilder(Password, "password")
      .delete()
      .where(`password."userId" = :userId`, {
        userId: contact.user.id,
      })
      .execute();

    await tran.save(password);
  });

  return {};
};
