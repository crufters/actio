import { DataSource } from "typeorm";
import { ChargesRequest, ChargesResponse, Charge } from "./models.js";

import { AuthenticationService } from "../authentication/index.js";

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
