# config

A config service that supports both the database and dotenv.
The model has a few explicit values

All envars starting with `CONFIG_` are loaded into the `data` field of the config.

All envars starting with `SECRET_` are loaded into the `data` field of the secret.

Secrets are not available through http, but they can be saved with http with admin rights.

Secrets are meant to be read by services.
