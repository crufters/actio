# Actio

Actio is a lightweight framework that enables you to start your codebase as a monolith and move into a microservices architecture at any point without code changes. In essence it is a batteries included (has support for database dependencies and even services like authentication, file upload etc.) dependency injection library that is designed with a microservices focus.

## Table of contents

- [A basic Actio service](#a-basic-service-exposed-over-http)
- [Goals and nongoals](#goals)
- [Configuring as microservices](#configuring-as-microservices)
- [Credit](#credit)

## A basic service exposed over http

```typescript
import { Service, Servicelike, Registrator } "@crufters/actio";
import { AuthenticationService } from "@crufters/actio/service/authentication";
import * as express from "express";

interface MyEndpointRequest {
    token: string;
}

@Service()
class MyService implements Servicelike {
    auth: AuthenticationService,
    constructor(auth: AuthenticationService) {
        this.auth = auth
    }

    // this endpoint will be exposed
    async myEndpoint(req: MyEndpointRequest) {
        let t = await this.auth.tokenRead({
            token: req.token,
        })
        console.log(`The calling user's name is ${t.token.user.fullName}`);
    }

    _onInit() {
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
```

## Goals

- [ ] Transition from monolith to services should be effortless
- [x] Service persistence layer (ie. database) should be isolated to prevent antipatterns like sidestepping service boundaries (eg. joins across services) etc.
- [x] Handle multitenancy (ie. namespaces) so a single instance deployed can run multiple side projects
- [x] Handle basic concepts like bootstrapping and seeding in a minimalistic way
- [x] Enable easy introduction of new infrastructure dependencies
- [x] Do not dictate ways of deployment and deployment architecture 
- [ ] Support clients in multiple frameworks (React, Angular) for easy frontend consumption

### Nongoals:

- Supporting writing services in multiple languages is not a near term goal.

Actio also aims to be batteries included: it contains a bunch of services that help you bootstrap your system (but does not force you to use these) faster:

- [x] Authentication service for login, register, oauth (facebook etc.) login
- [x] File service for file upload. Upload to a local disk or to Google Storage ec.
- [x] Config service for handling public configuration and secret values.
- [ ] Payment service with Stripe and other payment provider supports and a ledger that helps you keep track of money and accounts in case your system operates with topups.
- ...and many others that the community will find useful.

Let's list a few concepts that can give you a taste (without the intent of being complete or 100% easy to follow)

## Configuring as microservices

Turning your monolithic codebase into a microservices architecture can be done with minimal configuration.
Simply set the addresses of services through environment variables and function calls get monkey patched into network calls.

Note: this functionality is not in the main branch yet.

```
Without configuration, service calls are just normal function calls:
--------------------------------
|  Login Service    <-|  <-|   |
| Payment Service ----|    |   |
|  Order Service  ---------|   |
-------------------------------|
 instance address
     0.0.0.0
  no Actio config


With some lightweight configuration a true services based
architecture can be achieved, without code changes:

-------------------                     -----------------
| Payment Service |-------------------> | Login Service |
|  Order Service  |-------------------> |               |
-------------------                     -----------------
 instance address                        instance address
     0.0.0.0                                 0.0.0.1
envar LOGIN_SERVICE_ADDRESS=0.0.0.1

Calls to the login service become network calls automatically.
```

## Multiple instances for resiliency

Use a comma separated list of addresses to randomly call any of the instances:

```
envar LOGIN_SERVICE_ADDRESS=0.0.0.1:6061,0.0.0.2:6061
```

## Credits

Inspired by other microservices systems such as Micro[https://github.com/micro/micro] and the author's previous work with Asim Aslam.
Author: [János Dobronszki](https://github.com/crufter).
Contributors: Dávid Dobronszki[https://github.com/Dobika], Asim Aslam[https://github.com/asim], Viktor Veress[].