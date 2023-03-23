/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { Role, RoleListResponse } from "../models";

export default async (
  connection: DataSource,
  request: any
): Promise<RoleListResponse> => {
  let roles = await connection.getRepository(Role).find({});

  return {
    roles: roles,
  };
};
