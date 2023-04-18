import { Field } from "../../reflect.field.js";

export class NodesReadRequest {
  @Field()
  propagate: boolean;
}

export class NodesReadResponse {
  @Field({ hint: () => Node })
  nodes: Node[];
}

export class Node {
  @Field()
  id?: string;

  @Field()
  address: string;

  @Field()
  services: Service[];
}

export class Service {
  @Field()
  address: string;

  @Field()
  name: string;
}
