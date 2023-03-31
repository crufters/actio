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
