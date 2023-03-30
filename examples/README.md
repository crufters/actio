# Actio Examples

This folder contains example scripts using Actio which are being referred to from the root README.

Run `npm install` and `docker-compose up -d` in this folder and run a given script with `npx ts-node --esm ./basic.ts`. Replace `basic.ts` with the file you want to run.

This folder does not aim to be in depth for each service - that will be the job of the READMEs in the specific service folders, instead it aims to read more like a tutorial.

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
$ curl -XPOST -H "Content-Type: application/json" -d '{"contactUrl":"example@example.com", "password":"admin"}' 127.0.0.1:8080/AuthenticationService/userLogin
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
$ curl -XPOST -H "Content-Type: application/json" -d '{"token":"4o11JVud5mIFiFWC0FrcA"}' 127.0.0.1:8080/MyService/myEndpoint

{"hi":"The Admin"}
```

As you can see we successfully called the `AuthenticationService` from our own and read the name of the calling user.
