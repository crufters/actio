/**
 * Copyright (C) Dobronszki János - All Rights Reserved
 * Unauthorized copying of the files in this repo, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Dobronszki János <dobronszki@gmail.com>, 2021
 */

import { DataSource } from "typeorm";
import { BalanceRequest, BalanceResponse } from "./models";

import { AuthenticationService } from "../authentication";

export default async (
  connection: DataSource,
  auth: AuthenticationService,
  req: BalanceRequest
): Promise<BalanceResponse> => {
  let token = await auth.tokenRead({
    token: req.token,
  });

  let result = await connection.query(
    `select sum(credit) - sum(debit) as balance from
      transaction_entry te
      inner join account a on a.id = te."accountId"
      where a."userId" = '${token.token.userId}'
      and a.type = 'internal'`
  );

  return {
    balance: parseFloat(result[0].balance) || 0,
  };
};
