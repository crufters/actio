import { DataSource } from "typeorm";
import {
  User,
  UserSlugCheckRequest,
  UserSlugCheckResponse,
} from "../models.js";

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
