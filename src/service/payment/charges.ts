/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { ChargesRequest, ChargesResponse, Charge } from "./models";

import { AuthenticationService } from "../authentication";

export default async (
  connection: DataSource,
  auth: AuthenticationService,
  req: ChargesRequest
): Promise<ChargesResponse> => {
  let token = await auth.tokenRead({
    token: req.token,
  });

  let charges = await connection
    .createQueryBuilder(Charge, "payment")
    .where(`payment."userId" = :userId`, { userId: token.token.userId })
    .getMany();

  return {
    charges: charges,
  };
};
