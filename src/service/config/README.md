[<- Back to Getting Started](../../../docs/README.md) 
# Config Service

This is a config service that supports both loading data from the database or dotenv.

- [Config Service](#config-service)
  - [Concepts](#concepts)
  - [Envars](#envars)
  - [Conventions](#conventions)
    - [Top level values](#top-level-values)
    - [Default config/secrets for your services](#default-configsecrets-for-your-services)

## Concepts

The config service deals with two kind of data: `Config` and `Secrets`.

`Config`s are meant to be readable without authorization. Prime examples are public keys, eg. Facebook app ID, Stripe public key etc.

`Secrets` are meant to be read by services.

Secrets are not readable through HTTP, but they can be updated through HTTP with admin rights.

## Envars

All envars starting with `CONFIG_` are loaded into the `data` field of the config.

All envars starting with `SECRET_` are loaded into the `data` field of the secret.

## Conventions

We advise that you save data into the config service under a key that is unique to your service, the key should most probably be its name.

See for example how the [`AuthenticationService`](../authentication/README.md) uses the config service:

```ts
let srsp = await this.config.secretRead({});
let secret: Secret = srsp.secret.data.AuthenticationService;
```

### Top level values

There are a few notable top level values which fall outside of the convention mentioned in the previous section:

Using the notation from the code above:

```ts
// tells the system that this is a production instance
// used by eg. the FileService
srsp.secret.data.isProduction
```

### Default config/secrets for your services

We encourage you to define your own `Secret` type in your service for ease of understanding when someone explores your service, similar to what the [`AuthenticationService`](../authentication/README.md) is doing:

```ts
export class Secret {
  /** Admin user fullname */
  fullName?: string;
  /** Admin user email */
  adminEmail?: string;
  /** Admin user password */
  adminPassword?: string;
  /** Admin user organization name */
  adminOrganization?: string;

  sendgrid?: {
    key?: string;
  };
  email?: {
    from?: string;
    register?: {
      /**
       * Subject of
       */
      subject?: string;
      text?: string;
    };
  };

  // https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow#login
  facebookAppID?: string;
  facebookAppSecret?: string;
  facebookAppRedirectURL?: string;
}

export const defaultSecret: Secret = {
  adminEmail: "example@example.com",
  adminPassword: "admin",
  adminOrganization: "Admin Org",
  fullName: "The Admin",
};
```

We advise you to reuse this `Secret` type across your service, ie. use the same structure to save secrets.

So in practice, you might do something like this:

```ts
let srsp = await this.config.secretRead({});
// using your own Secret type to understand data obtained from config service
let secret: Secret = srsp.secret.data.YourServiceName;
```