import { Injector, toSnakeCase } from "../../injector.js";
import { env } from "../../env.js";
import _ from "lodash";
import { NodesReadRequest, NodesReadResponse } from "./models.js";

export default async (
  injector: Injector,
  request: NodesReadRequest
): Promise<NodesReadResponse> => {
  let addresses = new Map();
  let rsp: NodesReadResponse = {
    nodes: [],
  };
  let node = {
    id: injector.nodeID,
    address: env.selfAddress,
    services: [],
  };

  injector.availableClassNames().forEach((className) => {
    let address =
      injector.addresses.get(className) ||
      injector.addresses.get(toSnakeCase(className)) ||
      process.env[className] ||
      process.env[toSnakeCase(className)];
    if (address) {
      addresses.set(className, address);
      node.services.push({
        name: className,
        address: address,
      });
    } else {
      node.services.push({
        name: className,
      });
    }
  });
  rsp.nodes.push(node);

  if (request.propagate) {
    await Promise.all(
      _.map(Array.from(addresses.values()), async (address) => {
        let resp: NodesReadResponse = (await injector.serviceCall(
          address,
          "System",
          "nodesRead",
          []
        )) as NodesReadResponse;
        resp.nodes.forEach((n) => {
          n.address = address;
          rsp.nodes.push(n);
        });
      })
    );
  }

  return rsp;
};
