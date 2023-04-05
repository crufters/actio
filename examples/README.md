# Actio Examples

This folder does not aim to be in depth for the topics covered here - that will be the job of the READMEs in specific folders.

Instead it aims to read more like a tutorial.

<!-- vscode-markdown-toc -->
* 1. [How to run these examples](#Howtoruntheseexamples)
* 2. [How to create a new project from scratch](#Howtocreateanewprojectfromscratch)
	* 2.1. [Initialize](#Initialize)
	* 2.2. [tsconfig.ts](#tsconfig.ts)
	* 2.3. [package.json](#package.json)
	* 2.4. [index.ts](#index.ts)
	* 2.5. [Compile and run](#Compileandrun)
	* 2.6. [cURL](#cURL)
* 3. [Authentication](#Authentication)
* 4. [Endpoint decorators](#Endpointdecorators)
	* 4.1. [Unexposed](#Unexposed)
		* 4.1.1. [Why Unexposed is important](#WhyUnexposedisimportant)
	* 4.2. [Raw](#Raw)
* 5. [Testing](#Testing)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->

##  1. <a name='Howtoruntheseexamples'></a>How to run these examples

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

##  2. <a name='Howtocreateanewprojectfromscratch'></a>How to create a new project from scratch

###  2.1. <a name='Initialize'></a>Initialize

Run the following in your terminal:

```sh
mkdir myproject; cd myproject
npm init --yes
npm i -S @crufters/actio
npm i -S express; npm i -S @types/express
npm i -D typescript; npm i -D @types/googlemaps
npx tsc --init
touch index.ts
```

###  2.2. <a name='tsconfig.ts'></a>tsconfig.ts

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

###  2.3. <a name='package.json'></a>package.json

and make sure the `package.json` has `"type": "module"`.

###  2.4. <a name='index.ts'></a>index.ts

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

###  2.5. <a name='Compileandrun'></a>Compile and run

Compile and run your project from project root:

```sh
npx ts-node --esm ./index.ts
```

Should output `Server is listening on port 8080`.

Now do a curl:

###  2.6. <a name='cURL'></a>cURL

```sh
curl -XPOST -d '{"name":"Johnny"}' 127.0.0.1:8080/MyService/myEndpoint
```

The output should be:

```sh
{"hi":"Johnny"}
```

##  3. <a name='Authentication'></a>Authentication

Let's run the `auth.ts` example and curl it:

In one terminal tab do:

```sh
$ npx ts-node --esm ./auth.ts
Server is listening on port 8080
```

Please note that while `auth.ts` contains no login endpoint, our service has the `AuthenticationService` as a dependency and it is important to understand that:

> All services in the dependency graph gets their endpoints registered and exposed through HTTP.

In other words, since our little `MyService` has `AuthenticationService` as a dependency, the many endpoints of the `AuthenticationService` get exposed as endpoint as well. So let's try to curl them - let's try to log in.

Here we run into the problem of not knowing what the API looks like. A builtin API explorer is coming soon, but for now we can check the [`models.ts`](../src/service/authentication/models.ts) of each service.

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

##  4. <a name='Endpointdecorators'></a>Endpoint decorators

###  4.1. <a name='Unexposed'></a>Unexposed

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

####  4.1.1. <a name='WhyUnexposedisimportant'></a>Why Unexposed is important

The `@Unexposed` decorator is supremely important because it enables us to build endpoints only available to other services but not available to end users at the API gateway level.

@todo: For monoliths the current implementation is fine but for a microservices setup we need to build out a service to service call mechanism driven by this decorator.

###  4.2. <a name='Raw'></a>Raw

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

##  5. <a name='Testing'></a>Testing

Running a single test:

```sh
npm test -- -t 'Init only happens once'
```
