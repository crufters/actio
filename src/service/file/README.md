# File Service

- [File Service](#file-service)
  - [Concepts](#concepts)
  - [File upload](#file-upload)
  - [Configuration](#configuration)

This service is aimed to be a zero config service for file uploads.

Locally it saves files to your home folder in the `actio-files` folder.

In production mode currently it supports Google Cloud Storage.
More backends are coming, please open an issue to give ideas to the authors.

## Concepts

As it can be seen my looking at the [models file](./models.ts), a `File` object consists of:

```ts
id?: string;
url?: string;
originalName?: string;
size?: number;
```

In your services using the `FileService` it is sufficient to save the file URL for simplicity.

## File upload

To upload files, set the `Content-Type` request header to `"multipart/form-data"`.

The service can accept multiple files.

## Configuration

The service checks the top level `isProduction` config value to decide if to save to the local system or to Google Cloud Storage.

See [ConfigService](../config/README.md#top-level-values) for more details.