import { DataSource } from "typeorm";
import { Value, GetRequest, GetResponse } from "./models.js";
import { AuthenticationService } from "../authentication/index.js";
import { Role } from "../authentication/models.js";

export default async function (
  connection: DataSource,
  auth: AuthenticationService,
  req: GetRequest
): Promise<GetResponse> {
  let v = await connection
    .createQueryBuilder(Value, "value")
    .where("value.key = :key", { key: req.key })
    .andWhere("value.namespace = :namespace", { namespace: req.namespace })
    .getOne();

  if (!v) {
    return {
      value: null,
    };
  }

  if (!v.public) {
    if (!req.token) {
      throw new Error("no permission");
    }
    let tokenRsp = await auth.tokenRead({
      token: req.token,
    });
    if (v.ownedByUser && v.userId != tokenRsp.token.user.id) {
      throw new Error("no permission");
    }
    if (!v.ownedByUser) {
      let departmentIds = getDepartmentIds(tokenRsp.token.user.roles);
      if (!departmentIds.includes(v.departmentId)) {
        throw new Error("no permission");
      }
    }
  }

  return {
    value: v,
  };
}

function getDepartmentIds(roles: Role[]): string[] {
  return roles
    .filter((r) => r.key.includes("department:"))
    .map((r) => r.key.split(":")[1]);
}
