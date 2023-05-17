<p align="center">
<img width="200" height="200" src="assets/actiologo.png">
</p>
<h1 align="center">Actio</h1>
<h4 align="center">The Node.js framework for monoliths and microservices.</h4>
<p align="center">
<img src="https://github.com/crufters/actio/actions/workflows/build.yaml/badge.svg" /> <a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg" alt="License: AGPL v3"/></a> <img src="https://img.shields.io/badge/semver-0.2.26-yellow" />
</p>

Actio is a modern, batteries included Node.js (Typescript) framework for your backend applications.

```sh
npm i -S @crufters/actio
```

## Simple

Actio values simplicity and elegance, because enjoying coding makes you more productive.

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

## Dependencies made easy

Your services can easily call each other just by accepting a constructor parameter:

```ts
@Service()
class MyService implements Servicelike {
  constructor(otherService: MyOtherService) {}
}
```

## Monolith or microservices? Actio blurs the line

Service calls are just function calls. Function calls become network calls simply by configuring Actio with envars:

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

## Batteries included

Actio is batteries included: it comes with services that help you bootstrap your system (but tries to not force you to use these) faster:

- [x] Authentication service for login, register, oauth (facebook etc.).
- [x] File service for file upload. Upload to a local disk or to Google Storage etc. in production.
- [x] Config service for handling public configuration and secret values.
- [x] Payment service: a double entry ledger system with Stripe and other payment provider support.
- [ ] ...and many others that the community will find useful.

## Built with infrastructure in mind

Real world apps need persistence and many other infrastructure elements.
Actio manages your infra dependencies just like your service dependencies.

- [x] Postgres
- [ ] Redis
- [ ] Many more coming

## Testing without the hassle

Run integration tests easily including all of your services and infrastructure dependencies. No need for mocking.

## Namespaced for server savings

Actio enables you to run multiple projects from the same single server by namespaces. Save on server and maintenance cost.

## Examples and tutorials

For examples and tutorials see the [examples folder](./examples).

## Credits

Inspired by other microservices systems such as [Micro](https://github.com/micro/micro) and the author's previous work with Asim Aslam.
Author: [János Dobronszki](https://github.com/crufter).
Contributors: [Dávid Dobronszki](https://github.com/Dobika), [Asim Aslam](https://github.com/asim), [Viktor Veress](https://github.com/vvik91).
