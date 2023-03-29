import {
  Service,
  Servicelike,
  Registrator,
  AuthenticationService,
} from "@crufters/actio";

import express from "express";

interface MyEndpointRequest {
  token: string;
}

@Service()
class MyService implements Servicelike {
  auth: AuthenticationService;

  constructor(auth: AuthenticationService) {
    this.auth = auth;
  }

  // this endpoint will be exposed as a http endpoint, ie.
  // curl 127.0.0.1/my-service/my-endpoint
  async myEndpoint(req: MyEndpointRequest) {
    let t = await this.auth.tokenRead({
      token: req.token,
    });
    console.log(`The calling user's name is ${t.token?.user?.fullName}`);
  }

  async _onInit() {
    console.log("This callback runs when the server boots up.");
    console.log("Perfect place to run do things like seeding the database.");
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
