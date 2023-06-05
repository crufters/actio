import { test, expect, describe } from "@jest/globals";
import { Injector } from "../../injector.js";
import { nanoid } from "nanoid";
import { AuthenticationService } from "./index.js";

describe("auth user update", () => {
  var auth: AuthenticationService;

  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);

    let i = new Injector([AuthenticationService]);
    auth = await i.getInstance("AuthenticationService", namespace);
  });

  test("auth was initiated", async () => {
    expect(auth).toBeTruthy();
  });

  test("meta tests", async () => {
    let rsp = await auth.userRegister({
      user: {
        contacts: [{ url: "test-3@test.com" }],
      },
      password: "1011",
    });

    await auth.userRegister({
      user: {
        contacts: [{ url: "test-4@test.com" }],
      },
      password: "1011",
    });

    await auth.userSave({
      token: rsp.token.token,
      user: {
        meta: {
          x: "y",
          y: true,
          obj: {
            a: "b",
          },
        },
      },
    });

    await auth.userSave({
      token: rsp.token.token,
      user: {
        meta: {
          z: 3,
        },
      },
    });
    let trsp = await auth.tokenRead({ token: rsp.token.token });
    expect(trsp.token.user.meta.x).toBe("y");
    expect(trsp.token.user.meta.y).toBe(true);
    expect(trsp.token.user.meta.z).toBe(3);

    await auth.userSave({
      token: rsp.token.token,
      user: {
        meta: {
          obj: {
            b: "c",
          },
        },
      },
    });

    trsp = await auth.tokenRead({ token: rsp.token.token });
    expect(trsp.token.user.meta.obj.a).toBe("b");
    expect(trsp.token.user.meta.obj.b).toBe("c");
  });

  test("org update", async () => {
    let rsp = await auth.userRegister({
      user: {
        contacts: [{ url: "test-5@test.com" }],
      },
      password: "1015",
    });

    await auth.userCreateOrganization({
      token: rsp.token.token,
      organization: {
        name: "user test org",
      },
    });

    await auth.userCreateOrganization({
      token: rsp.token.token,
      organization: {
        name: "user test org",
      },
    });
  });
});
