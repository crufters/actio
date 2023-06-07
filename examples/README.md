# Actio Examples

This folder does not aim to be in depth for the topics covered here - that will be the job of the READMEs in specific folders.

Instead it aims to read more like a tutorial.

- [Actio Examples](#actio-examples)
  - [1. How to run these examples](#1-how-to-run-these-examples)
  - [2. How to create a new project from scratch](#2-how-to-create-a-new-project-from-scratch)
    - [2.1. Initialize](#21-initialize)
    - [2.2 tsconfig.ts](#22-tsconfigts)
    - [2.3. package.json](#23-packagejson)
    - [2.4. index.ts](#24-indexts)
    - [2.5. Compile and run](#25-compile-and-run)
    - [2.6. cURL](#26-curl)
  - [3. Authentication](#3-authentication)
  - [4. Endpoint decorators](#4-endpoint-decorators)
    - [4.1. Unexposed](#41-unexposed)
      - [4.1.1. Why Unexposed is important](#411-why-unexposed-is-important)
    - [4.2. Raw](#42-raw)
  - [5. Testing](#5-testing)
    - [5.1. Anatomy of a test](#51-anatomy-of-a-test)
    - [5.2.Misc](#52misc)


## 1. How to run these examples

Run

```sh
npm install
docker-compose up -d
```

in this folder.

To run a given you can do

```sh
npx ts-node --esm ./basic.ts
```

Replace `basic.ts` with the file you want to run.

## 2. How to create a new project from scratch

### 2.1. Initialize

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

### 2.2 tsconfig.ts

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

### 2.3. package.json

and make sure the `package.json` has `"type": "module"`.

### 2.4. index.ts

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

### 2.5. Compile and run

Compile and run your project from project root:

```sh
npx ts-node --esm ./index.ts
```

Should output `Server is listening on port 8080`.

Now do a curl:

### 2.6. cURL

```sh
curl -XPOST -d '{"name":"Johnny"}' 127.0.0.1:8080/MyService/myEndpoint
```

The output should be:

```sh
{"hi":"Johnny"}
```

## 3. Authentication

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

(The field ContactURL might seem a bit unintuitive at first but the authentication service is designed to work with phones, emails etc.)

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

## 4. Endpoint decorators

### 4.1. Unexposed

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

#### 4.1.1. Why Unexposed is important

The `@Unexposed` decorator is supremely important because it enables us to build endpoints only available to other services but not available to end users at the API gateway level.

@todo: For monoliths the current implementation is fine but for a microservices setup we need to build out a service to service call mechanism driven by this decorator.

### 4.2. Raw

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

The prefix if `http` in the method name is not mandatory.

## 5. Testing

### 5.1. Anatomy of a test

Actio's dependency injection makes it a breeze to test your services. Let's build a simple key value service and test it.
For ease of reading we will put the service and the test in the same file:

```ts
import { test, expect, describe } from "@jest/globals";
import { nanoid } from "nanoid";
import { Service, Injector } from "@crufters/actio";
import { DataSource, Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class KV {
  @PrimaryColumn()
  id?: string;

  @Column()
  value?: string;
}

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

### 5.2.Misc

Running a single test:

```sh
npm test -- -t 'Init only happens once'
```
