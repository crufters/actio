[<- Back to Getting Started](../../../docs/README.md) 

# KeyValue service

- [KeyValue service](#keyvalue-service)
  - [Use case](#use-case)
  - [Fields](#fields)
    - [key](#key)
    - [namespace](#namespace)
    - [ownedByUser](#ownedbyuser)
    - [public](#public)
    - [publicWrite](#publicwrite)



Sometimes it is useful for frontend engineers to be able to save unstructured data into the database without bothering backend engineers to add yet another tables/fields/endpoints.

The `KeyValue` service serves this need.

Unfortunately it is hard to write a generic service for this purpose without knowing the authorization rules of the specific application, but the `KeyValue` service sidesteps this issue by assigning ownership of a `Key` to the `User` or `Department` that first created it.

## Use case

For an imperfect* example consider the following:

You are a Reddit developer and want to save unstructured theming options for subreddits. Now assuming the moderators all belong to the same `Department`, all you have to do is to set the value like this:

```ts
await keyValueService.set({
  token: myToken,
  value: {
        key: "$subreddit-id",
        namespace: "themingOptions",
        // key will be owned by the department and not the
        // user that saves this key
        ownedByUser: false,
        // public means the options will be publicly readable
        // ie. without a token
        public: true,
        value: { 'background-color': '#ff0000' },
    },
});
```

## Fields

Below are the fields for the `Value` type that this service accepts (see [`models.ts`](./models.ts)).

### key

The key : ). ([Everyone knows what a horse is](https://en.wikipedia.org/wiki/Nowe_Ateny#:~:text=Nowe%20Ateny%20is%20the%20source,a%20stinking%20kind%20of%20animal.)).

This is most likely an object id that exists somewhere else in your application. A subreddit ID, a webshop ID, a user ID etc.

### namespace

The namespace simply exists so you can save multiple things for a key. For a user ID key you could save namespaces like "preferences", "settings", "history" etc.

### ownedByUser

If true, it is the user that owns the key and not their department.

### public

If true then the key will be publicly (ie. without a token) readable.

### publicWrite

If true, the key will have no concept of ownership, anyone can write or read it.