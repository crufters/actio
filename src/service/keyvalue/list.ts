import { DataSource } from "typeorm";
import { Value, ListRequest, ListResponse } from "./models.js";
import { AuthenticationService } from "../authentication/index.js";
import { Role } from "../authentication/models.js";

export default async function list(
  connection: DataSource,
  auth: AuthenticationService,
  req: ListRequest
): Promise<ListResponse> {
  let values = await connection
    .createQueryBuilder(Value, "value")
    .where("value.namespace = :namespace", { namespace: req.namespace })
    .getMany();

  if (!values.length) {
    return {
      values: [],
    };
  }

  let filteredValues = [];

  for (let v of values) {
    if (v.public) {
      filteredValues.push(v);
    } else {
      if (!req.token) {
        continue;
      }
      let tokenRsp = await auth.tokenRead({ token: req.token });
      if (v.ownedByUser && v.userId !== tokenRsp.token.user.id) {
        continue;
      }
      if (!v.ownedByUser) {
        let departmentIds = getDepartmentIds(tokenRsp.token.user.roles);
        if (!departmentIds.includes(v.departmentId)) {
          continue;
        }
      }
      filteredValues.push(v);
    }
  }

  return {
    values: filteredValues,
  };
}

function getDepartmentIds(roles: Role[]): string[] {
  return roles
    .filter((r) => r.key.includes("department:"))
    .map((r) => r.key.split(":")[1]);
}