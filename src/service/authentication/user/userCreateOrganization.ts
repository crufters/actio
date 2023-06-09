import { nanoid } from "nanoid";
import slug from "slug";
import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  Department,
  Organization,
  Token,
  UserCreateOrganizationRequest,
  UserCreateOrganizationResponse,
} from "../models.js";

export default async (
  connection: DataSource,
  request: UserCreateOrganizationRequest
): Promise<UserCreateOrganizationResponse> => {
  if (!request.organization) {
    throw error("missing organization", 400);
  }
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .where("token.token = :id", { id: request.token })
    .leftJoinAndSelect("token.user", "user")
    .leftJoinAndSelect("user.roles", "role")
    .leftJoinAndSelect("user.departments", "department")
    .getOne();
  if (!token) {
    throw error("token not found", 400);
  }

  // check if organization exists
  let existingOrganization = await connection
    .createQueryBuilder(Organization, "organization")
    .where("organization.name = :name", { name: request.organization.name })
    .leftJoinAndSelect("organization.departments", "department")
    .getOne();
  if (
    existingOrganization &&
    existingOrganization.departments.length > 0 &&
    existingOrganization.departments.find((d) =>
      token.user.departments.find((ud) => ud.id == d.id)
    )
  ) {
    return {
      organization: existingOrganization,
    };
  }

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

  let user = token.user;
  user.departments = [department];
  user.roles.push(
    {
      id: nanoid(),
      key: `organization:${organization.id}:admin`,
    },
    { id: nanoid(), key: `department:${department.id}:admin` }
  );

  await connection.transaction(async (tran) => {
    // roles will be saved (created even)
    // due to the cascade option, see the model
    await tran.save(organization);
    await tran.save(department);
    await tran.save(user);
  });

  return {
    organization: organization,
  };
};
