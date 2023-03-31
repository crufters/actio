import "./env.js";

import { Service, startServer, AuthenticationService } from "@crufters/actio";

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

startServer([MyService]);
