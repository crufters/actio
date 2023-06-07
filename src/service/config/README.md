# Config Service

This is a config service that supports both loading data from the database or dotenv.

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
