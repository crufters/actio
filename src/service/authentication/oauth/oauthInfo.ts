

import { DataSource } from "typeorm";
import { OauthInfoRequest, OauthInfoResponse } from "../models.js";

export default async (
  connection: DataSource,
  request: OauthInfoRequest,
  facebookAppID?: string
): Promise<OauthInfoResponse> => {
  return {
    facebookAppID: facebookAppID,
  };
};
