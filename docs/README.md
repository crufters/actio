
This is a getting started guide. For more in depth docs about particular services see:
- [AuthenticationService](../src/service/authentication/README.md)
- [ConfigService](../src/service/config/README.md)
- [FileService](../src/service/file/README.md)
# Getting started

- [Getting started](#getting-started)
  - [How to run these examples](#how-to-run-these-examples)
  - [Authentication](#authentication)
  - [Endpoint decorators](#endpoint-decorators)
    - [Unexposed](#unexposed)
      - [Why Unexposed is important](#why-unexposed-is-important)
    - [Raw](#raw)
  - [Testing](#testing)
    - [Anatomy of a test](#anatomy-of-a-test)
    - [Misc](#misc)
  - [How to create a new project from scratch](#how-to-create-a-new-project-from-scratch)
    - [Initialize](#initialize)
    - [tsconfig.ts](#tsconfigts)
    - [package.json](#packagejson)
    - [index.ts](#indexts)
    - [Compile and run](#compile-and-run)
    - [cURL](#curl)


## How to run these examples

Run

```sh
npm install
docker-compose up -d
```

in this folder.

To run a given example you can do

```sh
npx ts-node --esm ./basic.ts
```

Replace `basic.ts` with the file you want to run.

## Authentication

Let's run the `auth.ts` example and curl it:

In one terminal tab do:

```sh
$ npx ts-node --esm ./auth.ts
Server is listening on port 8080
```

Please note that while `auth.ts` contains no login endpoint, our service has the `AuthenticationService` as a dependency and it is important to understand that:

> All services in the dependency graph gets their endpoints registered and exposed through HTTP.

In other words, since our little `MyService` has `AuthenticationService` as a dependency, the many endpoints of the `AuthenticationService` get exposed as endpoint as well. So let's try to curl them - let's try to log in.

Here we run into the problem of not knowing what the API looks like. A builtin API explorer and OpenAPI etc. exports are coming soon, but for now we can check the [`models.ts`](../src/service/authentication/models.ts) of each service.

By grepping for `login`, we can see this request type:

```sh
export interface UserLoginRequest {
  contactUrl: string;
  password: string;
}
```

(The field `contactURL` might seem a bit unintuitive at first but the authentication service is designed to work with any platform where the user can uniquely identify themselves - phones, emails etc.)

We have no users yet but there is a default admin user registered. The default user can be configured through the `ConfigService` but when no config is set, the system uses the following credentials:

```sh
admin email: "example@example.com",
admin password: "admin",
full name: "The Admin"
organization: "Admin Org
```

```sh
$ curl -XPOST -d '{"contactUrl":"example@example.com", "password":"admin"}' 127.0.0.1:8080/AuthenticationService/userLogin
```

The response is:

```js
{
   "token":{
      "id":"XJQ0yTpUGHUuSoU5rr1f2",
      "userId":"0884WWzEkSdU0wPdOEcPd",
      "createdAt":"2023-03-30T10:16:54.563Z",
      "token":"4o11JVud5mIFiFWC0FrcA",
      "description":null,
      "updatedAt":"2023-03-30T10:16:54.563Z"
   }
}
```

We can grab the `token` and call our endpoint which tries to read this user:

```sh
$ curl -XPOST -d '{"token":"4o11JVud5mIFiFWC0FrcA"}' 127.0.0.1:8080/MyService/myEndpoint

{"hi":"The Admin"}
```

As you can see we successfully called the `AuthenticationService` from our own and read the name of the calling user.

Note that the current pattern of calling the AuthenticationService in most endpoints is prone to fan-out but a JWT implementation is being considered for those who prefer to avoid that.

## Endpoint decorators

### Unexposed

You can use the `@Unexposed` decorator to mark a method as one that should not be exposed as a HTTP endpoint.

See `unexposed.ts`:

```ts
@Service()
class MyService {
  constructor() {}

  // this method will be exposed as an HTTP endpoint
  async myEndpoint(req: MyEndpointRequest) {
    return { hi: req.name };
  }

  // this method WILL NOT be exposed as an HTTP endpoint
  @Unexposed()
  async notMyEndpoint(req: MyEndpointRequest) {
    return { hi: req.name };
  }
}
```

Let's fire it up

```sh
$ npx ts-node --esm ./unexposed.ts
Server is listening on port 8080
```

If we curl `myEndpoint`, it returns as expected:

```sh
$ curl -XPOST -d '{"name":"Johnny"}' 127.0.0.1:8080/MyService/myEndpoint

{"hi":"Johnny"}
```

Curling `notMyEndpoint`, marked with the `@Unexposed` decorator returns a 404:

```sh
$ curl -XPOST -d '{"name":"Johnny"}' 127.0.0.1:8080/MyService/notMyEndpoint

{"error":"endpoint not found"}
```

The server log should show something like this:

```sh
MyService/myEndpoint 4ms 200
MyService/notMyEndpoint 1ms 404 Error { message: 'endpoint not found' }
```

#### Why Unexposed is important

The `@Unexposed` decorator is supremely important because it is the primary mechanism for "Service to service" calls. It enables us to build unauthenticated endpoints only available to other services but not available to end users at the API gateway level.

Here is an example:

Imagine a versatile and generic coupon service where the coupon creation endpoint is `@Unexposed`. The coupon service might handle code generation, expiry and all other functionalities but it might not know why a user gets a coupon - that might be too usecase specific and hinder reusability of the service.

We can move authorization to the caller services by making CouponCreate @Unexposed and implement our own logic upwards in the call chain. Do users get a Coupon as part of some kind of game? They purchase it? The coupon service doesn't necessarily have to care.


@todo: For monoliths the current implementation is fine (and works) but for a microservices setup we need to build out a service to service call mechanism driven by this decorator.

### Raw

Class methods get turned into JSON expecting HTTP endpoints by Actio. This works fine for most use cases but sometimes we need access to the underlying HTTP request and response types. A prime example of that is the `FileService`:

```ts
  @Raw()
  httpFileUpload(req: express.Request, rsp: express.Response) {
    fileUpload(req, rsp, this.config);
  }

  @Raw()
  httpFileServe(req: express.Request, rsp: express.Response) {
    fileServe(req, rsp, this.config);
  }
```

(Note: The prefix if `http` in the method name is not mandatory.)

You should try to refrain from using this decorator unless you absolutel must or know what you are doing.

## Testing

### Anatomy of a test

Actio's dependency injection makes it a breeze to test your services. Let's build a simple key value service and test it.
For ease of reading we will put the service and the test in the same file:

```ts
import { test, expect, describe } from "@jest/globals";
import { nanoid } from "nanoid";
import { Service, Injector } from "@crufters/actio";
import { DataSource, Entity, PrimaryColumn, Column } from "typeorm";

// define typeorm database entity
@Entity()
export class KV {
  @PrimaryColumn()
  id?: string;

  @Column()
  value?: string;
}

// define request and response types
interface SetRequest {
  key?: string;
  value?: string;
}

interface GetRequest {
  key?: string;
}

interface GetResponse {
  value?: string;
}

// implement our service
@Service()
class MyService {
  meta = {
    typeorm: {
      entities: [KV],
    },
  };
  constructor(private db: DataSource) {}

  async set(req: SetRequest) {
    await this.db
      .createEntityManager()
      .save(KV, { id: req.key, value: req.value });
  }

  async get(req: GetRequest): Promise<GetResponse> {
    let v = await this.db
      .createQueryBuilder(KV, "kv")
      .where("kv.id = :id", { id: req.key })
      .getOne();
    return { value: v?.value };
  }
}

// run some simple tests
describe("my test", () => {
  var myService: MyService;

  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let i = new Injector([MyService]);
    myService = await i.getInstance("MyService", namespace);
  });

  test("set get test", async () => {
    await myService.set({ key: "testkey", value: "testvalue" });
    let rsp = await myService.get({ key: "testkey" });
    expect(rsp.value).toBe("testvalue");
  });
});
```

The above tests have the following anatomy:

```ts
@Entity()
export class KV {
  @PrimaryColumn()
  id?: string;

  @Column()
  value?: string;
}
```

We define the TypeORM database entities our service will handle.

```ts
interface SetRequest {
  key?: string;
  value?: string;
}

interface GetRequest {
  key?: string;
}

interface GetResponse {
  value?: string;
}
```

We define a few interfaces for our endopints. If you look into actual Actio services they are all classes, but here interfaces will do. The difference between the two is that interfaces can't be annotated with reflection hence type information about request and response types can't be extracted. For now we don't care about that.

Let's continue:

```ts
@Service()
class MyService {
  meta = {
    typeorm: {
      entities: [KV],
    },
  };
  constructor(private db: DataSource) {}
```

Here we see two important points. First is that the meta field contains TypeORM settings, namely, the entities we defined is listed here. This is important because Actio sets up the a separate database for each service for namespacing and data isolation purposes, so it needs to know about your entities.

The second important point is accepting the TypeORM `DataSource` type in the constructor parameter. This will make sure Actio will inject it to your service.

```ts
  async set(req: SetRequest) {
    await this.db
      .createEntityManager()
      .save(KV, { id: req.key, value: req.value });
  }

  async get(req: GetRequest): Promise<GetResponse> {
    let v = await this.db
      .createQueryBuilder(KV, "kv")
      .where("kv.id = :id", { id: req.key })
      .getOne();
    return { value: v?.value };
  }
```

Here we do nothing special, just saving and retrieving database entries. Could not be simpler!

Now let's move onto the tests themselves:

```ts
describe("my test", () => {
  var myService: MyService;

  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let i = new Injector([MyService]);
    myService = await i.getInstance("MyService", namespace);
  });

  test("set get test", async () => {
    await myService.set({ key: "testkey", value: "testvalue" });
    let rsp = await myService.get({ key: "testkey" });
    expect(rsp.value).toBe("testvalue");
  });
});
```

Perhaps the most important point here is the usage of a random namespace (` let namespace = "t_" + nanoid().slice(0, 7);`). This enables you to run each test in a fresh database. There is no need for setup or teardown. Setup happens automatically.

Teardown is not part of Actio yet, but since every test runs in a fresh database worst case is that you will accumulate databases in your local postgres instance.

Congrats! You just implemented and nicely tested a stateful service that talks to the database!

@todo: perhaps Actio could provide helper functions for test namespace generation instead of repeating `let namespace = "t_" + nanoid().slice(0, 7);` everywhere.

### Misc

Running a single test:

```sh
npm test -- -t 'Init only happens once'
```

## How to create a new project from scratch

### Initialize

Run the following in your terminal:

```sh
mkdir myproject; cd myproject
npm init --yes
npm i -S @crufters/actio
npm i -S express; npm i -S @types/express
npm i -D typescript;
npx tsc --init
touch index.ts
```

### tsconfig.ts

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

### package.json

and make sure the `package.json` has `"type": "module"`.

### index.ts

Create a basic service in index.ts

```ts
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
```

### Compile and run

Compile and run your project from project root:

```sh
npx ts-node --esm ./index.ts
```

Should output `Server is listening on port 8080`.

Now do a curl:

### cURL

```sh
curl -XPOST -d '{"name":"Johnny"}' 127.0.0.1:8080/MyService/myEndpoint
```

The output should be:

```sh
{"hi":"Johnny"}
```