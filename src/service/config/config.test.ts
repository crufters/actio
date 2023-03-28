import { test, expect, describe } from "@jest/globals";
import { Injector } from "../../injector.js";
import { nanoid } from "nanoid";
import { ConfigService } from "./index.js";

describe("Config tests", () => {
  var config: ConfigService;
  test("setup", async () => {
    let namespace = "t_" + nanoid().slice(0, 7);
    let i = new Injector([ConfigService]);
    config = await i.getInstance("ConfigService", namespace);
  });

  test("config read basics", async () => {
    expect(config).toBeTruthy();
    let rsp = await config.configRead({});
    expect(rsp.config?.data).toBeTruthy();
  });

  // test if saved values get deeply merged
  test("config value merge test", async () => {
    expect(config).toBeTruthy();
    let rsp = await config.configSaveS2S({
      token: "",
      config: {
        slogan: "slogan1",
        data: {
          "test-val1": "test-val1",
        },
      },
    });
    expect(rsp.config?.data).toBeTruthy();
    expect(rsp.config?.data["test-val1"]).toBe("test-val1");
    expect(rsp.config?.slogan).toBe("slogan1");
    let rsp2 = await config.configSaveS2S({
      token: "",
      config: {
        domain: "domain1",
        data: {
          "test-val2": "test-val2",
        },
      },
    });
    expect(rsp2.config?.data).toBeTruthy();
    expect(rsp2.config?.data["test-val2"]).toBe("test-val2");
    expect(rsp2.config?.domain).toBe("domain1");

    let readResp = await config.configRead({});
    expect(readResp.config?.data).toBeTruthy();
    expect(readResp.config?.data["test-val1"]).toBe("test-val1");
    expect(readResp.config?.data["test-val2"]).toBe("test-val2");
    expect(readResp.config?.domain).toBe("domain1");
    expect(readResp.config?.slogan).toBe("slogan1");
  });
});
