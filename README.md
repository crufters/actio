<p align="center">
<img width="200" height="200" src="assets/actiologo.png">
</p>
<h1 align="center">Actio</h1>
The Node.js framework for monoliths and microservices.
<p align="center">
<img src="https://github.com/crufters/actio/actions/workflows/build.yaml/badge.svg" /> <a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg" alt="License: AGPL v3"/></a> <img src="https://img.shields.io/badge/semver-0.1.0-yellow" />
</p>

Actio is a lightweight, batteries included Node.js framework for your backend applications.

It enables you to start your codebase as a monolith and move into a microservices architecture at any point without code changes.

Somewhat inspired by Angular, in essence it is a dependency injection framework that comes with builtin services that help you solve real world problems - such as handling database connections, authentication, file uploads and more.

This project is currently being extracted from a private codebase, if you like what you see please drop a star to keep me motivated as it's a lot of work. Thanks.

## Table of contents

- [A basic Actio application](#a-basic-actio-application)
  - [Other examples](#other-examples)
- [Tutorials](#tutorials)
- [Services included](#services-included)
- [Supported infrastructure dependencies](#supported-infrastructure-dependencies)
- [Running as microservices](#running-as-microservices)
  - [Multiple instances for resiliency](#multiple-instances-for-resiliency)
- [Multitenancy and testing](#multitenancy-and-testing)
- [Developing Actio](#developing-actio)
  - [Testing](#testing)
- [Configuration](#configuration)
- [Goals](#goals)
  - [Nongoals](#nongoals)
- [Credits](#credits)

## A basic Actio application

```typescript
import { Service, Servicelike, startServer } from "@crufters/actio";

interface MyEndpointRequest {
  name?: string;
}

@Service()
class MyService implements Servicelike {
  constructor() {}

  // this method will be exposed as an HTTP endpoint
  async myEndpoint(req: MyEndpointRequest) {
    return { hi: req.name };
  }

  async _onInit() {
    console.log("MyService: _onInit runs whenever the server boots up.");
  }
}

startServer([MyService]);
```

If you want to see how to set up your own project with Actio (required `tsconfig.json` options etc.) see [this section](examples/README.md#how-to-create-a-new-project-from-scratch).

### Other examples

For more in depth examples and tutorials see the [examples folder](./examples).

## Tutorials

The readme in the [`examples` folder](examples) is your best place if you are looking for tutorials.

## Services included

Actio aims to be batteries included: it contains a bunch of services that help you bootstrap your system (but tries to not force you to use these) faster:

- [x] Authentication service for login, register, oauth (facebook etc.) login
- [x] File service for file upload. Upload to a local disk or to Google Storage etc. in production.
- [x] Config service for handling public configuration and secret values.
- [x] Payment service with Stripe and other payment provider supports and a ledger that helps you keep track of money and accounts in case your system operates with topups.
- [ ] ...and many others that the community will find useful.

## Supported infrastructure dependencies

- [x] Postgres
- [ ] Redis
- [ ] Many more coming

## Running as microservices

Turning your monolithic codebase into a microservices architecture can be done with minimal configuration.
Simply set the addresses of services through environment variables and function calls get monkey patched into network calls.

```
Without configuration, service calls are just normal function calls:
--------------------------------
|  LoginService     <-|  <-|   |
| PaymentService  ----|    |   |
|  OrderService   ---------|   |
-------------------------------|
 instance address
     0.0.0.0
  no Actio config


With some lightweight configuration a true services based
architecture can be achieved, without code changes:

-------------------                     -----------------
| PaymentService  |-------------------> | LoginService  |
|  OrderService   |-------------------> |               |
-------------------                     -----------------
 instance address                        instance address
     0.0.0.0                                 0.0.0.1
envar LOGIN_SERVICE=0.0.0.1

Calls to the login service become network calls automatically.
```

Naturally, you need to keep your services stateless - ie. no public class variables, only method.

@todo could use some CLI tooling to prevent stateful applications with a linter

### Multiple instances for resiliency

Note: this is not implemented yet

Use a comma separated list of addresses to randomly call any of the instances:

```
envar LOGIN_SERVICE=0.0.0.1:6061,0.0.0.2:6061
```

## Multitenancy and testing

Actio support multitenancy by either passing the `namespace` as either a header or a cookie.
Namespaces are useful for two reasons:

- They enable you to serve multiple frontends/applications from the same backend server.
- They enable you to do integration or end to end tests effortlessly without overwriting your existing data.
- Services and their data are isolated anyway to avoid the classic microservices faux pas where services sidestep API boundaries and read each others data directly. This happens more often than you think in systems where there's no safeguard against this.

To see an example of multitenancy look at any of the jest tests in Actio, for example the config service test starts like this:

```ts
describe("Config tests", () => {
  var config: ConfigService;

  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let i = new Injector([ConfigService]);
    config = await i.getInstance("ConfigService", namespace);
  });

  // to see more check the `config.test.ts` file
});
```

Each test has its own namespace so tests don't step on each others toes.

### Tests and config

It is best practice to write services in a way that requires the least amount of configuration so tests
are easy to run.

## Developing Actio

This section is about developing Actio itself.

### Testing

Running a single test:

```sh
npm test -- -t 'Init only happens once'
```

## Configuration

TBD

## Goals

- [ ] Transition from monolith to services should be effortless
- [x] Service persistence layer (ie. database) should be isolated to prevent antipatterns like sidestepping service boundaries (eg. joins across services) etc.
- [x] Handle multitenancy (ie. namespaces) so a single instance deployed can run multiple side projects
- [x] Handle basic concepts like bootstrapping and seeding in a minimalistic way
- [x] Enable easy introduction of new infrastructure dependencies
- [x] Do not dictate ways of deployment and deployment architecture
- [ ] Support clients in multiple frameworks (React, Angular) for easy frontend consumption

### Nongoals

- Supporting writing services in multiple languages is not a near term goal.

## Credits

Inspired by other microservices systems such as [Micro](https://github.com/micro/micro) and the author's previous work with Asim Aslam.
Author: [János Dobronszki](https://github.com/crufter).
Contributors: [Dávid Dobronszki](https://github.com/Dobika), [Asim Aslam](https://github.com/asim), [Viktor Veress](https://github.com/vvik91).
