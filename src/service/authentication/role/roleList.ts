import { DataSource } from "typeorm";
import { Role, RoleListResponse } from "../models.js";

export default async (
  connection: DataSource,
  request: any
): Promise<RoleListResponse> => {
  let roles = await connection.getRepository(Role).find({});

  return {
    roles: roles,
  };
};
