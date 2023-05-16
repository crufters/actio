import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  roleAdmin,
  Token,
  User,
  UserListRequest,
  UserListResponse,
} from "../models.js";

export default async (
  connection: DataSource,
  request: UserListRequest
): Promise<UserListResponse> => {
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
    .leftJoinAndSelect("user.departments", "department")
    .getOne();

  let isAdmin = false;
  if (user.roles?.find((r) => r.id == roleAdmin.id)) {
    isAdmin = true;
  }

  if (!isAdmin) {
    throw error("no rights", 400);
  }

  if (!request.orderByField) {
    request.orderByField = "createdAt";
  }
  if (!request.skip) {
    request.skip = 0;
  }
  if (!request.limit) {
    request.limit = 100;
  }

  if (
    request.departmentId &&
    !user.departments.find((d) => {
      return (d.id = request.departmentId);
    })
  ) {
    throw error("no access to department", 400);
  }

  if (request.departmentId) {
    let users: User[] = await connection
      .createQueryBuilder(User, "user")
      .orderBy("user." + request.orderByField, request.asc ? "ASC" : "DESC")
      .skip(request.skip)
      .limit(request.limit)
      .innerJoinAndSelect(
        "user.departments",
        "department",
        "department.id = :departmentId",
        { departmentId: request.departmentId }
      )
      .leftJoinAndSelect("user.roles", "role")
      .leftJoinAndSelect("user.contacts", "contact")
      //.leftJoinAndSelect("user.thumbnail", "thumbnail")
      .leftJoinAndSelect("department.organization", "organization")
      //.leftJoinAndSelect("organization.thumbnail", "orgthumbnail")
      .getMany();

    return {
      users: users,
    };
  }

  let users: User[] = await connection
    .createQueryBuilder(User, "user")
    .orderBy("user." + request.orderByField, request.asc ? "ASC" : "DESC")
    .skip(request.skip)
    .limit(request.limit)
    .leftJoinAndSelect("user.roles", "role")
    .leftJoinAndSelect("user.contacts", "contact")
    //.leftJoinAndSelect("user.thumbnail", "thumbnail")
    .leftJoinAndSelect("user.departments", "department")
    .leftJoinAndSelect("department.organization", "organization")
    //.leftJoinAndSelect("organization.thumbnail", "orgthumbnail")
    .getMany();

  return {
    users: users,
  };
};
