import { Service, Servicelike, Registrator } from "@crufters/actio";

import express from "express";

interface MyEndpointRequest {
  name?: string;
}

@Service()
class MyService implements Servicelike {
  constructor() {}

  // this endpoint will be exposed as a http endpoint
  async myEndpoint(req: MyEndpointRequest) {
    return { hi: req.name };
  }

  async _onInit() {
    console.log(
      "MyService: This callback runs when the server boots up. Perfect place to run do things like seeding the database."
    );
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
