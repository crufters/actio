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
  }

  async myEndpoint(req: MyEndpointRequest) {
    let token = await this.auth.tokenRead({ token: req.token });
    return { hi: token.token.user?.fullName };
  }
}

startServer([MyService]);
