/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource, SelectQueryBuilder } from "typeorm";
import {
  User,
  Department,
  Token,
  DepartmentListRequest,
  DepartmentListResponse,
  roleAdmin,
  roleBusiness,
} from "../models";
import { error } from "../../../sys";

export default async (
  connection: DataSource,
  req: DepartmentListRequest
): Promise<DepartmentListResponse> => {
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .where("token.token = :id", { id: req.token })
    .getOne();
  if (!token) {
    throw error("token not found", 400);
  }

  let user: User = await connection
    .createQueryBuilder(User, "user")
    .where("user.id = :id", { id: token.userId })
    .leftJoinAndSelect("user.roles", "roles")
    .getOne();

  let isAdmin = false;
  if (user.roles?.find((r) => r.id == roleAdmin.id)) {
    isAdmin = true;
  }
  let isBusiness = false;
  if (user.roles?.find((r) => r.id == roleBusiness.id)) {
    isBusiness = true;
  }

  if (isAdmin && false) {
    let departments: Department[] = await join(
      connection
        .createQueryBuilder(Department, "department")
        .orderBy("department.createdAt", "DESC")
        .leftJoinAndSelect("department.users", "user")
    ).getMany();

    return {
      departments: departments,
    };
  }
  if (!isBusiness) {
    throw error("no access", 400);
  }

  let departments: Department[] = await connection
    .createQueryBuilder(Department, "department")
    .orderBy("department.createdAt", "DESC")
    .innerJoinAndSelect("department.users", "user", "user.id = :userId", {
      userId: user.id,
    })
    .getMany();

  return {
    departments: departments,
  };
};

export function join(
  s: SelectQueryBuilder<Department>
): SelectQueryBuilder<Department> {
  return s.leftJoinAndSelect("department.users", "user");
}
