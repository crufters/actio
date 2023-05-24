import { DataSource } from "typeorm";
import { error } from "../../../util.js";
import {
  roleAdmin,
  Token,
  User,
  UserSaveRequest,
  UserSaveResponse,
} from "../models.js";

export default async (
  connection: DataSource,
  request: UserSaveRequest
): Promise<UserSaveResponse> => {
  let token: Token = await connection
    .createQueryBuilder(Token, "token")
    .where("token.token = :id", { id: request.token })
    .getOne();
  if (!token) {
    throw error("token not found", 400);
  }

  let caller: User = await connection
    .createQueryBuilder(User, "user")
    .where("user.id = :id", { id: token.userId })
    .leftJoinAndSelect("user.roles", "role")
    .getOne();

  let user = new User(request.user);
  user.id = caller.id;

  let isAdmin = false;
  if (caller.roles?.find((r) => r.id == roleAdmin.id)) {
    isAdmin = true;
  }

  // @todo allow admins to update roles maybe?
  delete user.roles;

  // only allow admins to update others
  if (!isAdmin && caller.id != user.id) {
    throw error("not permitted", 400);
  }

  await connection.transaction(async (tran) => {
    if (user.meta) {
      let dbUser = await tran.findOne(User, {
        select: ["meta"],
        where: { id: user.id },
      });
      if (dbUser && dbUser.meta) {
        user.meta = mergeObjects(user.meta, dbUser.meta);
      }
    }

    await tran.save(user);
  });

  return { user: user };
};

function mergeObjects(obj1, obj2) {
  if (typeof obj1 !== "object" || typeof obj2 !== "object") {
    // Return the non-object value if either input is not an object
    return obj2 !== undefined ? obj2 : obj1;
  }

  var mergedObj = {};

  // Merge keys from obj1
  for (var key in obj1) {
    if (obj1.hasOwnProperty(key)) {
      mergedObj[key] = mergeObjects(obj1[key], obj2[key]);
    }
  }

  // Merge keys from obj2
  for (var key in obj2) {
    if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
      mergedObj[key] = mergeObjects(obj1[key], obj2[key]);
    }
  }

  return mergedObj;
}
