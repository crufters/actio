# Payment

This service is aims to abstract away payment providers.
Currently only supports Stripe, and only supports payments where every time you have to pass in your card details.

The token is created on the frontend and can be only used once.

## Config

```js
config.data?.PaymentService.stripe_public_key;
```

or from envars

```sh
PAYMENT_STRIPE_PUBLIC_KEY
```

## Secrets

Secrets are either read from the config service:

```js
secret.data?.PaymentService.stripe_api_key;
```

or from envars

```sh
SECRET_PAYMENT_STRIPE_SECRET_KEY
```
