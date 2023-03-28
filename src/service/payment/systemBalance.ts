/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { SystemBalanceRequest, SystemBalanceResponse } from "./models.js";

import { AuthenticationService } from "../authentication/index.js";
import { roleAdmin } from "../authentication/models.js";
import { error } from "../../util.js";

export default async (
  connection: DataSource,
  auth: AuthenticationService,
  req: SystemBalanceRequest
): Promise<SystemBalanceResponse> => {
  let token = await auth.tokenRead({
    token: req.token,
  });
  if (!token.token.user.roles.find((r) => r.id === roleAdmin.id)) {
    throw error("not authorized", 401);
  }

  let result = await connection.query(
    `select sum(credit) - sum(debit) as balance from
        transaction_entry te
        inner join account a on a.id = te."accountId"
        and a."gatewayId" = $1
        and a.type = $2
        and a."userId" is null
        and a."organizationId" is null`,
    [req.gatewayId, req.type]
  );

  return {
    balance: parseFloat(result[0].balance) || 0,
  };
};
