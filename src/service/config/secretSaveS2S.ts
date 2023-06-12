//import { nanoid } from "nanoid";
import { DataSource } from "typeorm";
import { copy } from "../../util.js";
import { Secret, SecretSaveRequest, SecretSaveResponse } from "./models.js";

export default async (
  connection: DataSource,
  request: SecretSaveRequest
): Promise<SecretSaveResponse> => {
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

// taken from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}


/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}
