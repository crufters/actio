import "./env.js";

import {
  SystemService,
  AuthenticationService,
  startServer,
} from "@crufters/actio";

startServer([SystemService, AuthenticationService]);
