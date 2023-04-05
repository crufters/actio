import express from "express";
// import * as cr from "./crypt";
import { Error, error } from "./util.js";
import { Injector } from "./injector.js";
import chalk from "chalk";
import { isUnexposed, isRaw } from "./reflect.js";
import _ from "lodash";

// Registrator's responsibility is registering endpoints of a service
export class Registrator {
  /**
   * There are two ways to set addresses of services,
   * envars and this map.
   * @todo injector also has an addresses member, remove this duplication
   * if possible
   */
  public addresses = new Map<string, string>();
  app: express.Application;
  injector: Injector;

  constructor(app: express.Application) {
    this.app = app;
  }

  register(serviceClasses: any[]) {
    this.injector = new Injector(serviceClasses);
    this.injector.addresses = this.addresses;
    this.injector.log = true;

    // can't simply pass this.route as callback due to this issue:
    // https://stackoverflow.com/questions/49319353/typescript-this-instance-is-undefined-in-class
    this.app.get("/*", (req, rsp) => {
      this.route(req, rsp);
    });
    this.app.post("/*", (req, rsp) => {
      this.route(req, rsp);
    });
    this.app.options(
      "/*",
      (request: express.Request, response: express.Response) => {
        cors(request, response);
        response.status(204).end();
      }
    );
  }

  private async route(request: express.Request, response: express.Response) {
    let now = new Date();
    let err;
    let serviceName: string;
    let endpointName: string;

    let rsp: express.Response;
    try {
      cors(request, response);
      let path = request.originalUrl;
      let parts = path.split("/");
      if (parts.length < 3) {
        throw `expected format for endpoints example.com/$serviceName/$endpointName, got ${request.originalUrl}`;
      }
      serviceName = parts[1];
      endpointName = parts[2];

      rsp = await this.serve(request, response, serviceName, endpointName);
    } catch (e) {
      // handle json request throws/reject promises
      err = e;
      if (e instanceof Error) {
        rsp = response
          .status(e.status ? e.status : 500)
          .send(
            JSON.stringify({
              error: e.message,
            })
          )
          .end();
      } else {
        rsp = response
          .status(500)
          .send(
            JSON.stringify({
              // https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
              error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
            })
          )
          .end();
      }
    }
    function statusCodeColor(s: number): string {
      if (s < 400) {
        return chalk.green(s.toString());
      }
      if (s < 500) {
        return chalk.yellow(s.toString());
      }
      return chalk.red(s.toString());
    }

    let f = err ? chalk.red : chalk.green;
    let cf = err ? console.error : console.log;

    // document this somewhere
    if (err) {
      delete err.status;
    }
    cf(
      chalk.bold(`${serviceName}/${endpointName} `) +
        chalk.dim(`${new Date().getTime() - now.getTime()}ms`),
      !err ? `${f("200")}` : `${statusCodeColor(rsp.statusCode)}`,
      err ? err : ""
    );
  }

  // does not catch rejects/throws
  private async serve(
    request: express.Request,
    response: express.Response,
    serviceName: string,
    endpointName: string
  ): Promise<express.Response> {
    // @todo not used at the moment, remove or document
    // currently we rely on app.use(express.json());
    // to reintroduce body encryption/decryption we would need to use raw body
    // let req = cr.decryptReq(request);

    let namespace: string = request.headers.cookies
      ? request.cookies["namespace"]
      : undefined;
    if (!namespace) {
      namespace = request.headers["namespace"] as string;
    }
    if (!namespace) {
      namespace = "local";
    }

    let _class =
      this.injector.getClassByMetaName(serviceName) ||
      this.injector.getClassByName(
        capitalizeFirstLetter(serviceName) + "Service"
      ) ||
      this.injector.getClassByName(capitalizeFirstLetter(serviceName));
    if (!_class) {
      if (!_class) {
        throw error(
          "service with name " +
            serviceName +
            " not found, available services: " +
            this.injector.availableClassNames().join(", "),
          404
        );
      }
    }

    if (isUnexposed(_class, endpointName)) {
      throw error("endpoint not found", 404);
    }

    let service = await this.injector.getInstance(_class.name, namespace);

    if (isRaw(_class, endpointName)) {
      // raw request
      return await service[endpointName](request, response);
    } else {
      // json request

      let rsp;
      // @multiParamSupport
      // support endoints with multiple parameters
      // it will be hard to support optional parameters and multiple parameters at the same time,
      // ie.
      // async foo(a: array, b?, c?) {}  <-- if we receive an array, is it a, or a and b and c?
      // @todo think about this and test each edge case
      if (_.isArray(request.body) && service[endpointName].length > 1) {
        rsp = await service[endpointName](...request.body);
      } else {
        rsp = await service[endpointName](request.body);
      }
      return response.status(200).send(JSON.stringify(rsp)).end();
    }
  }
}

export function cors(request: express.Request, response: express.Response) {
  response
    .set("Content-Type", "application/json")
    .set("Access-Control-Allow-Origin", "*")
    .set("Access-Control-Allow-Headers", ["Content-Type", "namespace"]);
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function startServer(serviceClasses: any[], port?: number) {
  if (!port) {
    port = 8080;
  }
  const app = express();
  app.use(express.json());

  let reg = new Registrator(app);
  reg.register(serviceClasses);

  app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });
}
