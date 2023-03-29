<p align="center">
<img width="200" height="200" src="assets/actiologo.png">
</p>
<h1 align="center">Actio</h1>
<p align="center">
<img src="https://github.com/crufters/actio/actions/workflows/build.yaml/badge.svg" /> <a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/License-AGPL_v3-blue.svg" alt="License: AGPL v3"/></a> <img src="https://img.shields.io/badge/semver-0.0.37-yellow" />
</p>

Actio is a lightweight, batteries included Node.js framework for your backend applications.

It enables you to start your codebase as a monolith and move into a microservices architecture at any point without code changes.

Somewhat inspired by Angular, in essence it is a dependency injection framework that comes with builtin services that help you solve real world problems - such as handling database connections, authentication, file uploads and more.

This project is currently being extracted from a private codebase, if you like what you see please drop a star to keep me motivated as it's a lot of work. Thanks.

## Table of contents

- [A basic service exposed over http](#a-basic-service-exposed-over-http)
  - [Existing examples](#existing-examples)
  - [Creating a basic Actio application](#creating-a-basic-actio-application)
- [Running as microservices](#running-as-microservices)
  - [Multiple instances for resiliency](#multiple-instances-for-resiliency)
- [Multitenancy and testing](#multitenancy-and-testing)
- [Framework development](#framework-development)
  - [Testing](#testing)
- [Configuration](#configuration)
- [Goals](#goals)
  - [Nongoals:](#nongoals-)
- [Credits](#credits)

## A basic service exposed over http

### Existing examples

If you just want to run existing examples, check `examples` folder.

After `npm install` in the `examples` folder you can use `npx ts-node --esm ./basic.ts` to run the application we are going to build from scratch below.

### Creating a basic Actio application

Let's create a new project:

```sh
mkdir myproject; cd myproject
npm init --yes
npm i -s @crufters/actio
npm i -s express; npm i -s @types/express
npm i --save-dev typescript; npm i --save-dev @types/googlemaps
npx tsc --init
touch index.ts
```

Put this into your `index.ts`:

```typescript
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
```

Make sure your `tsconfig.ts` looks something like this

```js
{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "outDir": "build",
    "rootDir": "./",
    "strict": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "experimentalDecorators": true,
     "emitDecoratorMetadata": true
  }
}
```

and make sure the `package.json` has `"type": "module"`.

Compile and run your project from project root:

```sh
npx ts-node --esm ./index.ts
```

Should output `Server is listening on port 8080`.

Now do a curl:

```sh
curl -XPOST -H "Content-Type: application/json" -d '{"name":"Johnny"}' 127.0.0.1:8080/MyService/myEndpoint
```

The output should be:

```sh
{"hi":"Johnny"}
```

You can find this script we've just built in the `examples/basic.ts` file.

## Running as microservices

Note: this functionality is not in the main branch yet.

Turning your monolithic codebase into a microservices architecture can be done with minimal configuration.
Simply set the addresses of services through environment variables and function calls get monkey patched into network calls.

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

### Multiple instances for resiliency

Use a comma separated list of addresses to randomly call any of the instances:

```
envar LOGIN_SERVICE_ADDRESS=0.0.0.1:6061,0.0.0.2:6061
```

## Multitenancy and testing

Actio support multitenancy by either passing the `namespace` as either a header or a cookie.
Namespaces are useful for two reasons:

- they enable you to serve multiple frontends/applications from the same backend server
- they enable you to do integration or end to end tests effortlessly without overwriting your existing data

To see an example of this look at any of the jest tests in Actio, for example the config service test starts like this:

```ts
describe("Config tests", () => {
  var config: ConfigService;

  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let i = new Injector([ConfigService]);
    config = await i.getInstance("ConfigService", namespace);
  });

  test("config read basics", async () => {
    expect(config).toBeTruthy();
    let rsp = await config.configRead({});
    expect(rsp.config?.data).toBeTruthy();
  });

  // to see more check the `config.test.ts` file
});
```

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

### Nongoals:

- Supporting writing services in multiple languages is not a near term goal.

Actio also aims to be batteries included: it contains a bunch of services that help you bootstrap your system (but does not force you to use these) faster:

- [x] Authentication service for login, register, oauth (facebook etc.) login
- [x] File service for file upload. Upload to a local disk or to Google Storage ec.
- [x] Config service for handling public configuration and secret values.
- [ ] Payment service with Stripe and other payment provider supports and a ledger that helps you keep track of money and accounts in case your system operates with topups.
- ...and many others that the community will find useful.

Let's list a few concepts that can give you a taste (without the intent of being complete or 100% easy to follow)

## Credits

Inspired by other microservices systems such as [Micro](https://github.com/micro/micro) and the author's previous work with Asim Aslam.
Author: [János Dobronszki](https://github.com/crufter).
Contributors: [Dávid Dobronszki](https://github.com/Dobika), [Asim Aslam](https://github.com/asim), [Viktor Veress]().
