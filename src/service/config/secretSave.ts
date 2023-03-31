import { DataSource } from "typeorm";
import { error, copy } from "../../util.js";
import { roleAdmin } from "../authentication/models.js";
import { AuthenticationService } from "../authentication/index.js";
import { Secret, SecretSaveRequest, SecretSaveResponse } from "./models.js";
import { mergeDeep } from "./configSaveS2S.js";

export default async (
  connection: DataSource,
  depProducer: (serviceName: string) => Promise<AuthenticationService>,
  request: SecretSaveRequest
): Promise<SecretSaveResponse> => {
  let auth = await depProducer("AuthenticationService");
  let token = await auth.tokenRead({
    token: request.token,
  });
  if (token.token.user.roles.find((r) => r.id == roleAdmin.id) == undefined) {
    throw error("not authorized", 400);
  }
  let dbSecret: Secret;
  try {
    dbSecret = await connection.createQueryBuilder(Secret, "secret").getOne();
  } catch (e) {
    console.log(e);
    return {
      secret: {},
    };
  }
  if (!dbSecret) {
    dbSecret = {
      data: {},
    };
  }

  let secret = new Secret();
  let result = mergeDeep(secret, dbSecret, request.secret);
  copy(result, secret);
  if (!secret.id) {
    secret.id = "1";
  }

  await connection.transaction(async (tran) => {
    await tran.save(secret);
  });

  return {
    secret: secret,
  };
};
