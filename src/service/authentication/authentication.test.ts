import { test, expect, describe } from "@jest/globals";
import { Injector } from "../../injector.js";
import { nanoid } from "nanoid";
import { AuthenticationService } from "./index.js";
import { ConfigService } from "../config/index.js";
import {
  DepartmentListResponse,
  platformEmail,
  UserRegisterResponse,
} from "./models.js";
import { getAPIJSON } from "../../reflect.api.js";

describe("config free auth", () => {
  var auth: AuthenticationService;
  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let i = new Injector([AuthenticationService]);
    auth = await i.getInstance("AuthenticationService", namespace);
  });

  test("admin account exists", async () => {
    expect(auth).toBeTruthy();
    let rsp = await auth.tokenAdminGet({});
    expect(rsp.token.token.length > 1).toBe(true);
  });
});

describe("auth", () => {
  var auth: AuthenticationService;
  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let config: ConfigService = await new Injector([ConfigService]).getInstance(
      "ConfigService",
      namespace
    );

    // set config instead of using defaultConfig to test if config is loaded
    await config.secretSaveS2S({
      token: "",
      secret: {
        data: {
          AuthenticationService: {
            fullName: "Joey Joe",
            adminEmail: "test@test.com",
            adminPassword: "123",
            adminOrganization: "Your Org",
          },
        },
      },
    });

    let i = new Injector([AuthenticationService]);
    auth = await i.getInstance("AuthenticationService", namespace);
  });

  test("auth was initiated", async () => {
    expect(auth).toBeTruthy();
  });

  test("token admin get works", async () => {
    let resp = await auth.tokenAdminGet({});
    expect(resp.token.token.length > 1).toBe(true);
  });

  var adminToken;

  test("admin login works", async () => {
    let resp = await auth.userLogin({
      contactUrl: "test@test.com",
      password: "123",
    });
    expect(resp.token.token.length > 1).toBe(true);
    adminToken = resp.token.token;
  });

  test("list works", async () => {
    let list = await auth.userList({
      token: adminToken,
    });
    expect(list.users.length).toBe(1);
  });

  test("slug exist check", async () => {
    // slug existing
    let slugCheck = await auth.userSlugCheck({
      slug: "joey-joe",
    });
    expect(slugCheck.taken).toBe(true);
  });

  test("slug not existing check", async () => {
    let slugCheck2 = await auth.userSlugCheck({
      slug: "someone-not-existing",
    });
    expect(slugCheck2.taken).toBe(false);
  });

  test("failing login", async () => {
    let errored = false;
    try {
      await auth.userLogin({
        contactUrl: "test@test.com",
        password: "1234",
      });
    } catch (e) {
      errored = true;
    }
    expect(errored).toBe(true);
  });

  test("save user with wrong token should fail", async () => {
    let errored = false;
    try {
      await auth.userSave({
        token: "wrong-token",
        user: {
          fullName: "Updated name",
        },
      });
    } catch (e) {
      errored = true;
    }
    expect(errored).toBe(true);

    await auth.userSave({
      token: adminToken,
      user: {
        fullName: "Updated name",
      },
    });
    let tokenRead = await auth.tokenRead({ token: adminToken });
    expect(tokenRead.token.user.fullName).toBe("Updated name");
    expect(tokenRead.token.user.roles.length > 0).toBe(true);
    expect(tokenRead.token.user.roles.length === 3).toBe(true);
  });

  test("password change with old password", async () => {
    await auth.passwordChangeWithOld({
      contactUrl: "test@test.com",
      oldPassword: "123",
      newPassword: "321",
    });

    // try login with old password
    let errored = false;
    try {
      await auth.userLogin({
        contactUrl: "test@test.com",
        password: "123",
      });
    } catch (e) {
      errored = true;
    }

    expect(errored).toBe(true);

    await auth.userLogin({
      contactUrl: "test@test.com",
      password: "321",
    });
  });

  var depResp: DepartmentListResponse;
  test("department exists for admin", async () => {
    // check if deparment exists for admin
    depResp = await auth.departmentList({ token: adminToken });
    expect(depResp.departments.length).toBe(1);
  });

  let userRegRsp: UserRegisterResponse;

  test("register should fail with invalid email", async () => {
    let errored = false;
    let em = "";
    try {
      userRegRsp = await auth.userRegister({
        user: {
          contacts: [{ url: "test-2" }],
          fullName: "Simple User Janey Jane",
        },
        password: "1011",
      });
    } catch (e) {
      errored = true;
      em = JSON.stringify(e);
    }
    expect(errored).toBe(true);
    expect(em).toContain("invalid email address");
  });

  test("register simple user", async () => {
    userRegRsp = await auth.userRegister({
      user: {
        contacts: [{ url: "test-2@test.com" }],
        fullName: "Simple User Janey Jane",
      },
      password: "1011",
    });
    let userTokenReadRsp = await auth.tokenRead({
      token: userRegRsp.token.token,
    });

    expect(userTokenReadRsp.token.user.roles.length).toBe(0);
    // @todo expect(userTokenReadRsp.token.user.slug).toBe("simple-user-janey-jane");
    expect(userTokenReadRsp.token.user.contacts[0].url).toBe("test-2@test.com");
    expect(userTokenReadRsp.token.user.contacts[0].platform.id).toBe(
      platformEmail.id
    );

    await auth.userCreateOrganization({
      token: userRegRsp.token.token,
      organization: {
        name: "My Org",
      },
    });
    let usrTk = await auth.tokenRead({ token: userRegRsp.token.token });
    expect(usrTk.token.user.roles.length).toBe(2);
    expect(usrTk.token.user.departments.length).toBe(1);
    let orgID = usrTk.token.user.departments[0].organizationId;
    let depID = usrTk.token.user.departments[0].id;
    expect(
      usrTk.token.user.roles.find(
        (r) => r.key === `organization:${orgID}:admin`
      )
    ).toBeTruthy();
    expect(
      usrTk.token.user.roles.find((r) => r.key === `department:${depID}:admin`)
    ).toBeTruthy();
  });

  test("register simple nameless user", async () => {
    await auth.userRegister({
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
  });

  test("registerOrLoginWithProvenIdentity test", async () => {
    let userRegOrIRsp = await auth.registerOrLoginWithProvenIdentity({
      email: "test-2@test.com",
    });
    // test that it would produce a new token
    expect(userRegOrIRsp.token.token != userRegRsp.token.token).toBe(true);

    expect(userRegOrIRsp.token.token.length > 1).toBe(true);
    let userTokenReadRsp = await auth.tokenRead({
      token: userRegOrIRsp.token.token,
    });
    expect(userTokenReadRsp.token.user.roles.length).toBe(2);
    // @todo expect(userTokenReadRsp.token.user.slug).toBe("simple-user-janey-jane");
    expect(userTokenReadRsp.token.user.contacts[0].url).toBe("test-2@test.com");
    expect(userTokenReadRsp.token.user.contacts[0].platform.id).toBe(
      platformEmail.id
    );
  });

  test("list users by department", async () => {
    let list = await auth.userList({
      token: adminToken,
      departmentId: depResp.departments[0].id,
    });
    expect(list.users.length).toBe(1);
  });

  test("user should not be able to list department it does not belong to", async () => {
    let errored = false;
    try {
      await auth.userList({
        token: userRegRsp.token.token,
        departmentId: depResp.departments[0].id,
      });
    } catch (e) {
      errored = true;
    }
    expect(errored).toBe(true);
  });

  let ghostToken;

  test("ghost registration", async () => {
    let ghostRsp = await auth.userRegister({ ghostRegister: true });
    expect(ghostRsp.token.token.length > 1).toBe(true);
    ghostToken = ghostRsp.token.token;
  });

  test("ghosted can not log in", async () => {
    let errored = false;
    try {
      await auth.userLogin({
        contactUrl: "test+ghost@test.com",
        password: "1234-ghost",
      });
    } catch (e) {
      errored = true;
    }
    expect(errored).toBe(true);
  });

  test("unghosted can log in after", async () => {
    await auth.userUnGhost({
      token: ghostToken,
      password: "1234-ghost",
      contact: {
        url: "test+ghost@test.com",
      },
    });

    await auth.userLogin({
      contactUrl: "test+ghost@test.com",
      password: "1234-ghost",
    });
  });

  test("user save test", async () => {
    await auth.userSave({
      token: ghostToken,
      user: {
        fullName: "Joe Noone",
      },
    });

    let rsp = await auth.tokenRead({
      token: ghostToken,
    });
    let usr = rsp.token.user;
    expect(usr.fullName).toBe("Joe Noone");

    await auth.userSave({
      token: ghostToken,
      user: {
        slug: "joe-no",
      },
    });
    rsp = await auth.tokenRead({
      token: ghostToken,
    });
    usr = rsp.token.user;
    expect(usr.fullName).toBe("Joe Noone");
    expect(usr.slug).toBe("joe-no");
  });
});

test("auth api", async () => {
  let api = getAPIJSON();
  let json = {
    services: {
      AuthenticationService: api.services.AuthenticationService,
    },
    types: {
      DepartmentListResponse: api.types.DepartmentListResponse,
      Department: api.types.Department,
    },
  };
  expect(
    JSON.parse(JSON.stringify(json))["services"]["AuthenticationService"][
      "departmentList"
    ]["info"]["options"]["returns"]
  ).toEqual("DepartmentListResponse");

  expect(
    JSON.parse(JSON.stringify(json))["types"]["DepartmentListResponse"][
      "departments"
    ]["data"]["hint"]
  ).toEqual("Department");

  expect(
    JSON.parse(JSON.stringify(json))["types"]["DepartmentListResponse"][
      "departments"
    ]["data"]["type"]
  ).toEqual("Array");

  expect(
    JSON.parse(JSON.stringify(json))["types"]["Department"]["users"]["data"][
      "hint"
    ]
  ).toEqual("User");
});
