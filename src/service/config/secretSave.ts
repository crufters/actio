import { DataSource } from "typeorm";
import { error } from "../../util.js";
import { roleAdmin } from "../authentication/models.js";
import { AuthenticationService } from "../authentication/index.js";
import { SecretSaveRequest, SecretSaveResponse } from "./models.js";
import secretSaveS2S from "./secretSaveS2S.js";

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
  return secretSaveS2S(connection, request);
};
