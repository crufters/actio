import "./env.js";

import { Service, Registrator, AuthenticationService } from "@crufters/actio";

import express from "express";

interface MyEndpointRequest {
  token: string;
}

@Service()
class MyService {
  auth: AuthenticationService;

  constructor(auth: AuthenticationService) {
    this.auth = auth;
    console.log(process.env.SQL_PASSWORD, process.env.SQL_USER);
  }

  async myEndpoint(req: MyEndpointRequest) {
    let token = await this.auth.tokenRead({ token: req.token });
    return { hi: token.token.user?.fullName };
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
