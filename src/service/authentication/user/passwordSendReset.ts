import { DataSource } from "typeorm";
import {
  PasswordSendResetRequest,
  PasswordSendResetResponse,
  User,
  SecretCode,
} from "../models.js";
import sendgrid from "@sendgrid/mail";
import { Error, error } from "../../../util.js";
import { nanoid } from "nanoid";
import { default as configRead } from "../../config/configRead.js";

export default async (
  connection: DataSource,
  request: PasswordSendResetRequest
): Promise<PasswordSendResetResponse> => {
  let user: User = await connection
    .createQueryBuilder(User, "user")
    .innerJoinAndSelect(
      "user.contacts",
      "contact",
      "contact.url = :contactUrl",
      { contactUrl: request.contactUrl }
    )
    .leftJoinAndSelect("user.roles", "role")
    .getOne();
  if (!user || !user.id) {
    throw error("not found", 400);
  }

  let code = new SecretCode();
  code.id = nanoid();
  code.code = nanoid();
  code.userId = user.id;

  let c = await configRead(connection, {});
  if (c instanceof Error) {
    return c;
  }

  // @todo(janos) get sendgrid key
  sendgrid.setApiKey("get sendgrid key");
  const msg: sendgrid.MailDataRequired = {
    // @todo this only supports a single contract
    to: user.contacts[0].url, // Change to your recipient
    from: c.config.contact.email, // Change to your verified sender
    subject: "Jelszó csere",
    text:
      "Szia,\n\nJelszó cserét kértél. Ezen a linken megteheted:\n\nhttps://" +
      c.config.domain +
      "/auth/password-reset?code=" +
      code.code +
      "\n\nHa mégsem te voltál, akkor hagyd figyelmen kívül ezt az emailt.\n\nA " +
      c.config.og.siteName +
      " csapata",
  };

  await connection.transaction(async (tran) => {
    await tran.save(code);
  });

  await sendgrid.send(msg);

  return {};
};
