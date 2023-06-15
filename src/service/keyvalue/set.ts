import { AuthenticationService } from "../authentication/index.js";
import { Role } from "../authentication/models.js";
import { DataSource } from "typeorm";
import { Value, SetRequest, SetResponse } from "./models.js";

export default async (
  connection: DataSource,
  auth: AuthenticationService,
  req: SetRequest
): Promise<SetResponse> => {
  let value: Value = new Value(req.value);

  let existingValue = await connection
    .createQueryBuilder(Value, "value")
    .where("value.key = :key", { key: value.key })
    .andWhere("value.namespace = :namespace", { namespace: value.namespace })
    .getOne();

  if (!existingValue) {
    await saveNewValue(auth, connection, req, value);
    return {
      value: value,
    };
  }

  // can't change publicity to hijack a public value
  value.publicWrite = existingValue.publicWrite;
  value.id = existingValue.id;

  // authorization
  if (!existingValue.publicWrite) {
    let tokenRsp = await auth.tokenRead({
      token: req.token,
    });

    if (
      existingValue.ownedByUser &&
      existingValue.userId != tokenRsp.token.user.id
    ) {
      throw new Error("no permission");
    }
    if (!existingValue.ownedByUser) {
      let departmentIds = getDepartmentIds(tokenRsp.token.user.roles);
      if (!departmentIds.includes(existingValue.departmentId)) {
        throw new Error("no permission");
      }
    }
  }

  value.value = mergeDeep(value.value, existingValue.value);

  await connection.transaction(async (tran) => {
    await tran.save(value);
  });

  return {
    value: value,
  };
};

async function saveNewValue(
  auth: AuthenticationService,
  connection: DataSource,
  req: SetRequest,
  value: Value
) {
  // for non public write values we need to set up ownership
  if (!value.publicWrite) {
    let tokenRsp = await auth.tokenRead({
      token: req.token,
    });
    value.userId = tokenRsp.token.user.id;

    // if not owned by the user, we need to check the departments
    if (!value.ownedByUser) {
      let departmentIds = getDepartmentIds(tokenRsp.token.user.roles);
      if (value.departmentId && !departmentIds.includes(value.departmentId)) {
        throw new Error("no permission");
      }
      if (!value.departmentId && departmentIds.length != 1) {
        throw new Error("cannot decide department");
      }
      if (!value.departmentId) {
        value.departmentId = departmentIds[0];
      }
    }
  }

  return connection.transaction(async (tran) => {
    await tran.save(value);
  });
}

function getDepartmentIds(roles: Role[]): string[] {
  return roles
    .filter((r) => r.key.includes("department:"))
    .map((r) => r.key.split(":")[1]);
}

export function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

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
