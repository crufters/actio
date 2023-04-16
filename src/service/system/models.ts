import { Field } from "../../reflect.field.js";

export class NodesReadRequest {
  @Field()
  propagate: boolean;
}

export class NodesReadResponse {
  @Field()
  nodes: Node[];
}

export class Node {
  address: string;
  services: Service[];
}

export class Service {
  address: string;
  name: string;
}
