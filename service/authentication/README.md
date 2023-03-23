# auth

## Facebook oauth setup

Based on https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow

https://medium.com/@jackrobertscott/facebook-auth-with-node-js-c4bb90d03fc0

https://stackoverflow.com/questions/13376710/facebook-app-domain-name-when-using-localhost

Include the facebook app id in the `AuthenticationService` config or add `AUTHENTICATION_FACEBOOK_APP_ID` and `AUTHENTICATION_FACEBOOK_APP_SECRET` to your `.env`.


### Facebook oauth troubleshooting

- It seems like one needs to use the `Facebook Login` app and not the `Facebook Login with Business` app because the latter does not work.

- If you don't get an email back, look at the permissions of the app

- For local development create a test app of your Facebook app.