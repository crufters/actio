[<- Back to Getting Started](./README.md) 
# Decorators

- [Decorators](#decorators)
  - [Unexposed](#unexposed)
  - [Raw](#raw)
  - [Field](#field)
  - [Param](#param)
  - [Endpoint](#endpoint)

Quite a few decorators (`@Field`, `@Param` and `@Endpoint`) exists to help with reflection. For more information about that please see the [SystemService](../src/service/system/README.md).

## Unexposed

The `@Unexposed` decorator makes your endpoint not accessible through HTTP. Your endpoint is still callable from other services as normal class methods.

Prime example is `secretRead` in the [config service](../src/service/config/README.md):

```ts
@Unexposed()
secretRead(req: SecretReadRequest) {
  // ...
}
```

## Raw

The `@Raw` decorator tells Actio that it should pass in raw HTTP request and response objects to your endpoints instead of just JSON request types:

```ts
@Raw()
httpFileUpload(req: express.Request, rsp: express.Response) {
  // ...
}
```

## Field

The `@Field` decorator is meant to be used on class properties so the Actio runtime reflection knows about the class structure.

```ts
export class PasswordChangeRequest {
  @Field()
  code?: string;
  @Field()
  newPassword?: string;
}
```

## Param

The `@Param` decorator is used to specify the types contained in higher order types for endpoint parameters.

Take this example:

```ts
myEndpoint(@Param({ type: number }) req: number[]) {}
```

Since `Array` (`[]`) is a higher order type, Typescript reflection can't see the contained `number` type. `@Param` solves that.

## Endpoint

The `@Endpoint` decorator is primarily used to specify the return type of an endpoint.

Take this example:

```ts
@Endpoint({
    returns: number
})
myEndpoint(): Promise<number>
```

Since `Promise` is a higher order type, TypeScript reflection can't see the contained `number` type. Specifying the contained type with the  `returns` parameter helps with that.
