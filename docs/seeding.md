[<- Back to Getting Started](./README.md) 

# Seeding and constants

- [Seeding and constants](#seeding-and-constants)
  - [Constants](#constants)
  - [Seeding](#seeding)

## Constants

In some of the service `models.ts` files the astute reader might spot constants similar to this:

```ts
export const platformEmail = new Platform();
platformEmail.id = "h4HZYn7FPpbdgVHBk1byc";
platformEmail.slug = "email";
platformEmail.name = "Email";

export const platformFacebook = new Platform();
platformFacebook.id = "wy_upG9BnzHvRg2WcSNgC";
platformFacebook.slug = "facebook";
platformFacebook.name = "Facebook";

export const platforms = [
  platformEmail,
  platformFacebook
];
```

This pattern is used for values that:
- do not change dynamically
- requires custom code support, so can't really be dynamic
- need to be (intra-service) referenced in the databased for strong guarantees

While hardcoding the id is admittedly not elegant, it enables both the backend and the frontend to easily reference the constants by their id.

There is no need to call a platform list endpoint to simply display a dropdown.

These values should be saved in an `_onInit` function.

## Seeding

@todo