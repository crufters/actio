/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { User, UserSlugCheckRequest, UserSlugCheckResponse } from "../models.js";

export default async (
  connection: DataSource,
  request: UserSlugCheckRequest
): Promise<UserSlugCheckResponse> => {
  let users = await connection
    .getRepository(User)
    .find({ where: { slug: request.slug } });

  if (!users || users.length == 0) {
    return {
      taken: false,
    };
  }

  return {
    taken: true,
  };
};
