

import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import slug from "slug";
import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  Contact,
  Department,
  Password,
  platformEmail,
  roleBusiness,
  roleUser,
  User,
  UserDepartmentRegisterRequest,
  UserDepartmentRegisterResponse,
} from "../models.js";

export default async (
  connection: DataSource,
  request: UserDepartmentRegisterRequest
): Promise<UserDepartmentRegisterResponse> => {
  //throw error("registration is currently closed", 400);
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

  let department: Department = await connection
    .createQueryBuilder(Department, "department")
    .where("department.id = :departmentId", {
      departmentId: request.departmentId,
    })
    .getOne();

  if (!department || !department.id) {
    throw error(`can't find department with id ${department.id}`, 400);
  }

  let userId = nanoid();
  let user = new User();
  user.id = userId;
  user.fullName = request.user.fullName;
  user.slug = request.user.slug ? slug(request.user.slug) : slug(user.fullName);
  // user.gender = request.user.gender;
  // user.birthDay = request.user.age;
  user.location = request.user.location;
  user.departments = [department];

  let contact = new Contact();

  let contactId = nanoid();
  contact.id = contactId;
  contact.platform = { id: platformEmail.id };
  contact.url = cont.url;
  contact.verified = false;
  contact.userId = userId;

  user.roles = [roleBusiness, roleUser];

  let password = new Password();
  password.id = await bcrypt.hash(request.password, 10);
  password.userId = userId;

  await connection.transaction(async (tran) => {
    await tran.save(user);
    await tran.save(password);
    await tran.save(contact);
  });
  // token.id = unhashedTokenId;

  return {};
};
