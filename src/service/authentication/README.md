# Authentication service

- [Authentication service](#authentication-service)
  - [Concepts](#concepts)
    - [Contacts](#contacts)
  - [Organizations and departments](#organizations-and-departments)
  - [Roles](#roles)
  - [Oauth](#oauth)
    - [Facebook oauth setup](#facebook-oauth-setup)
      - [Facebook oauth troubleshooting](#facebook-oauth-troubleshooting)

## Concepts

### Contacts

Looking at the models of the this service you might spot that the `User` class has no email field. The reason for this is that the Auth service is designed so different way of authenticating, such proving access to phones, or a Facebook account etc. is equivalent to an email registration.

This means that you can build a system where people register with phones and nothing else for example.

## Organizations and departments

In most systems there is a need for `Organization` accounts. While most users will have no `Organization`s, your advertisers for example will probably want multiple people accessing your software.

Looking at the `User` class it can be seen that users belong to `Department`s. `Department`s are simply a way to further divide `Organization`s into section. This is mostly useful for larger systems so they get created automatically when a user creates an organization:

```ts
let resp = await auth.userRegister({
  user: {
    contacts: [
      {
        url: "user@test.com",
      },
    ],
  },
  password: "123",
});

await auth.userCreateOrganization({
  token: resp.token.token,
  organization: {
    name: "Test Org",
  },
});
```

Once the user creates their Organization an organization and a department is created for them and they get assigned the following roles:

```
organization:$orgId:admin
department:$departmentId:admin
```

## Roles

There are no dictated roles in Actio, but a typical application will have the following roles:

- admin: this is the site admin, ie. you
- organization users: either all users for b2b apps, or your paying advertisers or similar in a b2c app
- a normal user without any roles to start out

## Oauth

### Facebook oauth setup

Based on https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow

https://medium.com/@jackrobertscott/facebook-auth-with-node-js-c4bb90d03fc0

https://stackoverflow.com/questions/13376710/facebook-app-domain-name-when-using-localhost

Include the facebook app id in the `AuthenticationService` config or add `AUTHENTICATION_FACEBOOK_APP_ID` and `AUTHENTICATION_FACEBOOK_APP_SECRET` to your `.env`.


#### Facebook oauth troubleshooting

- It seems like one needs to use the `Facebook Login` app and not the `Facebook Login with Business` app because the latter does not work.

- If you don't get an email back, look at the permissions of the app

- For local development create a test app of your Facebook app.