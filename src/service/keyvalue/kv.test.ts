import { test, expect, describe } from "@jest/globals";
import { Injector } from "../../injector.js";
import { nanoid } from "nanoid";
import { KeyValueService } from "./index.js";
import { AuthenticationService } from "../authentication/index.js";
import { Value } from "./models.js";

describe("keyvalue", () => {
  var serv: KeyValueService;
  var auth: AuthenticationService;

  // users belonging to two different
  // departments
  var tok1;
  var tok2;
  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let i = new Injector([KeyValueService]);
    serv = await i.getInstance("KeyValueService", namespace);
    auth = await i.getInstance("AuthenticationService", namespace);
    tok1 = (await auth.tokenAdminGet({})).token.token;
    let rsp = await auth.userRegister({
      password: "123456",
      user: {
        contacts: [
          {
            url: "something@something.com",
          },
        ],
      },
    });
    tok2 = rsp.token.token;
    await auth.userCreateOrganization({
      token: tok2,
      organization: {
        name: "some org",
      },
    });
  });

  test("public value readable without token", async () => {
    await serv.set({
      token: tok1,
      value: {
        key: "key1",
        namespace: "test",
        ownedByUser: true,
        public: true,
        value: { hi: "there" },
      },
    });

    let readRsp = await serv.get({
      key: "key1",
      namespace: "test",
    });
    expect(readRsp.value.value).toEqual({ hi: "there" });
    expect(readRsp.value.public).toBeTruthy();
    expect(readRsp.value.ownedByUser).toBeTruthy();
    expect(readRsp.value.userId).toBeTruthy();
    expect(readRsp.value.key).toEqual("key1");
    expect(readRsp.value.namespace).toEqual("test");
  });

  test("public value not writable by non owner", async () => {
    let val: Value = {
      key: "key2",
      namespace: "test",
      ownedByUser: true,
      public: true,
      value: { hi: "there" },
    };
    await serv.set({
      token: tok1,
      value: val,
    });

    // update by non owner should fail
    let errored = false;
    try {
      await serv.set({
        token: tok2,
        value: val,
      });
    } catch (e) {
      errored = true;
    }
    expect(errored).toBeTruthy();

    // update by owner
    val.value = { hi2: "there2" };
    await serv.set({
      token: tok1,
      value: val,
    });
    let readRsp = await serv.get({
      key: "key2",
      namespace: "test",
    });
    expect(readRsp.value.value).toEqual({ hi: "there", hi2: "there2" });
  });
});
