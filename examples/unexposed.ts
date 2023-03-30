import { Service, Registrator, Unexposed } from "@crufters/actio";

import express from "express";

interface MyEndpointRequest {
  name?: string;
}

@Service()
class MyService {
  constructor() {}

  // this method will be exposed as a HTTP endpoint
  async myEndpoint(req: MyEndpointRequest) {
    return { hi: req.name };
  }

  // this method WILL NOT be exposed as a HTTP endpoint
  @Unexposed()
  async notMyEndpoint(req: MyEndpointRequest) {
    return { hi: req.name };
  }
}

const app = express();
app.use(express.json());

const port = 8080;

let reg = new Registrator(app);
reg.register([MyService]);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
