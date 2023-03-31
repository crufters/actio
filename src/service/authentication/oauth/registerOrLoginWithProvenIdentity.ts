import { DataSource } from "typeorm";
import {
  Contact,
  Token,
  User,
  platformEmail,
  roleUser,
  RegisterOrLoginWithProvenIdentityRequest,
  RegisterOrLoginWithProvenIdentityResponse,
} from "../models.js";
import { nanoid } from "nanoid";

// can be used for facebook and all oauth registrations after the
// identity is proven
export default async (
  connection: DataSource,
  req: RegisterOrLoginWithProvenIdentityRequest
): Promise<RegisterOrLoginWithProvenIdentityResponse> => {
  let contacts = await connection
    .createQueryBuilder(Contact, "contact")
    .where("contact.url = :url", { url: req.email })
    .leftJoinAndSelect("contact.user", "user")
    .getMany();

  // user is already registered
  if (contacts.length > 0) {
    let token = new Token();
    token.id = nanoid();
    token.token = nanoid();
    token.userId = contacts[0].user.id;

    await connection.getRepository(Token).save(token);

    return {
      token: token,
    };
  }

  let userId = nanoid();
  let user = new User();
  user.fullName = req.firstName + " " + req.lastName;
  // @todo
  user.slug = nanoid();
  user.roles = [roleUser];

  let contact = new Contact();
  let contactId = nanoid();
  contact.id = contactId;
  contact.platformId = platformEmail.id;
  contact.url = req.email;
  contact.verified = true;
  contact.userId = userId;

  let token = new Token();
  token.id = nanoid();
  token.userId = userId;
  token.token = nanoid();

  await connection.transaction(async (tran) => {
    // roles will be saved (created even)
    // due to the cascade option, see the model
    await tran.save(user);
    await tran.save(contact);
    await tran.save(token);
  });

  return {
    token: token,
  };
};
