import { Service, Servicelike, startServer } from "@crufters/actio";

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

startServer([MyService]);
