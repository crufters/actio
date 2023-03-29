import { test, expect, describe } from "@jest/globals";
import { Injector } from "../../injector";
import { nanoid } from "nanoid";
import { PaymentService } from "./index";
import { AuthenticationService } from "../authentication/index";
import { UserRegisterResponse } from "../authentication/models";
import { ConfigService } from "../config/index";
import { AccountType, gatewayStripe } from "./models";
// import Stripe from "stripe";

describe("Check balance and payment history", () => {
  var ps: PaymentService;
  var auth: AuthenticationService;
  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let config: ConfigService = await new Injector([ConfigService]).getInstance(
      "ConfigService",
      namespace
    );

    await config.configSaveS2S({
      token: "",
      config: {
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

    let i = new Injector([PaymentService]);
    ps = await i.getInstance("PaymentService", namespace);
    ps.skipStripe = true;
    auth = await i.getInstance("AuthenticationService", namespace);
  });

  test("payment service was initiated", async () => {
    expect(ps).toBeTruthy();
    expect(auth).toBeTruthy();
  });

  let adminToken;
  test("get a token", async () => {
    let rsp = await auth.tokenAdminGet({});
    adminToken = rsp.token.token;
    expect(adminToken.length > 1).toBe(true);
  });

  test("pay works", async () => {
    await ps.topup({
      amount: 100,
      token: adminToken,
      stripeToken: "fake stripe",
      currency: "usd",
    });
  });

  test("balance works", async () => {
    let rsp = await ps.balance({
      token: adminToken,
    });
    expect(rsp.balance).toBe(100);
  });

  test("payment history works", async () => {
    let rsp = await ps.charges({
      token: adminToken,
    });
    expect(rsp.charges.length).toBe(1);
  });

  test("pay works 2", async () => {
    await ps.topup({
      amount: 200,
      token: adminToken,
      stripeToken: "fake stripe",
      currency: "usd",
    });
  });

  test("balance works 2", async () => {
    let rsp = await ps.balance({
      token: adminToken,
    });
    expect(rsp.balance).toBe(300);
  });

  test("payment history works 2", async () => {
    let rsp = await ps.charges({
      token: adminToken,
    });
    expect(rsp.charges.length).toBe(2);
  });

  let userRegRsp: UserRegisterResponse;
  let user2Token;
  test("register simple user", async () => {
    userRegRsp = await auth.userRegister({
      user: {
        contacts: [{ url: "test-2@test.com" }],
        fullName: "Simple User Janey Jane",
      },
      password: "1011",
    });
    user2Token = userRegRsp.token.token;
  });

  test("pay works 3", async () => {
    await ps.topup({
      amount: 200,
      token: user2Token,
      stripeToken: "fake stripe",
      currency: "usd",
    });
  });

  test("user balance increased to 200 after a 200 topup", async () => {
    let rsp = await ps.balance({
      token: user2Token,
    });
    expect(rsp.balance).toBe(200);
  });

  test("charge history is correct after topup", async () => {
    let rsp = await ps.charges({
      token: user2Token,
    });
    expect(rsp.charges.length).toBe(1);
  });

  test("company internal balance should be 0 before payment", async () => {
    let rsp = await ps.systemBalance({
      token: adminToken,
      gatewayId: gatewayStripe.id,
      type: AccountType.Internal,
    });
    expect(rsp.balance).toBe(0);
  });

  test("pay with balance", async () => {
    await ps.payWithBalance({
      amount: 100,
      token: user2Token,
      currency: "usd",
      itemId: "test-item-1",
    });
  });

  test("user 2 balance decreased by 100", async () => {
    let rsp = await ps.balance({
      token: user2Token,
    });
    expect(rsp.balance).toBe(100);
  });

  test("user 1 balance is intact", async () => {
    let rsp = await ps.balance({
      token: adminToken,
    });
    expect(rsp.balance).toBe(300);
  });

  test("company internal balance increased from 0 to 100", async () => {
    let rsp = await ps.systemBalance({
      token: adminToken,
      gatewayId: gatewayStripe.id,
      type: AccountType.Internal,
    });
    expect(rsp.balance).toBe(100);
  });
});
