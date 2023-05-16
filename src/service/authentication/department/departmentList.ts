import { DataSource, SelectQueryBuilder } from "typeorm";
import {
  User,
  Department,
  Token,
  DepartmentListRequest,
  DepartmentListResponse,
  roleAdmin,
} from "../models.js";
import { error } from "../../../util.js";

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
  // @todo check if user has access to department

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
  if (!isAdmin) {
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
