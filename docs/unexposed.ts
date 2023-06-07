import { Service, startServer, Unexposed } from "@crufters/actio";

interface MyEndpointRequest {
  name?: string;
}

@Service()
class MyService {
  constructor() {}

  // this method will be exposed as an HTTP endpoint
  async myEndpoint(req: MyEndpointRequest) {
    return { hi: req.name };
  }

  // this method WILL NOT be exposed as an HTTP endpoint
  @Unexposed()
  async notMyEndpoint(req: MyEndpointRequest) {
    return { hi: req.name };
  }
}

startServer([MyService]);
