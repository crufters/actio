/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { Platform, PlatformListResponse } from "../models.js";

export default async (
  connection: DataSource,
  request: any
): Promise<PlatformListResponse> => {
  let platforms = await connection.getRepository(Platform).find({});

  return {
    platforms: platforms,
  };
};
