import { inputParamTypeNames, getMeta, getDependencyGraph } from "./reflect.js";
import _ from "lodash";
import { TypeORMHandler } from "./typeorm.js";
import chalk from "chalk";

/**
 * A Handler is a leaf node dependency, eg. type ORM DataSource and similar.
 * The main difference between a Handler and a Service is that a Handler
 * must return a different type than itself.
 * Ie. a TypeORMHandler produces a DataSource, not a TypeORMHandler.
 */
interface Handler {
  handle(typeName: string, config?: any): Promise<any>;
  typeName: string;
}

/** Context is passed down to Handlers */
// interface Context {
//   /** Used to build multitenant applications ie.
//    * Enables services to serve multiple websites by appending
//    * a the namespace to the database name (not table names).
//    */
//   namespace?: string;
//   meta?: any;
// }

/**
 * Injector accepts a list of classes and can inject their dependencies
 * into them. Classes must be decorated with `@Service` to be injectable.
 * Lazily instantiates classes.
 */
export class Injector {
  public turnoffOnInit = false;
  log = false;

  classes: any[];
  // these handlers are the leaf nodes in the dependency graph
  // things like databases, etc.
  handlers: Handler[] = [new TypeORMHandler()];
  instancesByClassNameAndNamespace: Map<string, any> = new Map();
  inProgressByClassNameAndNamespace: Map<string, any> = new Map();

  constructor(classes: any[], handlers?: Handler[]) {
    // get the dependencies of all classes from their constructors
    this.classes = _.uniqBy(
      _.concat(classes, classes.map((c) => getDependencyGraph(c)).flat()),
      (c) => c.name
    );
    if (handlers?.length) {
      this.handlers = _.concat(this.handlers, handlers);
    }
    // remove classes that are provided by handlers, like 'DataSource'
    this.classes = this.classes.filter(
      (c) => !this.handlers.find((h) => h.typeName == c.name)
    );
    this.log &&
      console.log(
        `Injector created with classes ${this.classes
          .map((c) => c.name)
          .join(", ")}`
      );
  }

  getClassByMetaName(classMetaName: string): any {
    return this.classes.find((s) => {
      // @todo cache this

      let meta = getMeta(s);
      if (meta === undefined) {
        // throw "no metadata found for service " + s.name;
        return false;
      }
      if (meta.name == undefined) {
        // throw "no metadata.name found for service " + s.name;
        return false;
      }
      return meta?.name == classMetaName;
    });
  }

  getClassByName(className: string): any {
    return this.classes.find((s) => {
      return s.name == className;
    });
  }

  public availableClassNames(): string[] {
    return this.classes.map((c) => c.name);
  }

  /**
   * Get an instance of a class
   * @param className name of the class to get an instance of
   * @param namespace optional namespace for the database etc.
   * this might get removed soon to make this package more generic
   * @returns the instance of a class, with dependencies set up and appropriate
   * methods like _onInit etc. called.
   */
  async getInstance(className: string, namespace?: string): Promise<any> {
    let logPrefix = chalk.dim(
      `Injector.getInstance(${className}, ${namespace}):`
    );

    return new Promise(async (resolve, reject) => {
      if (!className) {
        reject("no class name provided for namespace " + namespace);
        return;
      }
      if (this.instancesByClassNameAndNamespace.has(className + namespace)) {
        resolve(
          this.instancesByClassNameAndNamespace.get(className + namespace)
        );
        return;
      }

      // if we're already in the process of creating this instance,
      // wait for it to finish and return it
      if (this.inProgressByClassNameAndNamespace.has(className + namespace)) {
        // This block is tested by the "Init only happens once" test
        this.log && console.log(chalk.dim(`${logPrefix} waiting for instance`));
        try {
          await until(
            () =>
              this.instancesByClassNameAndNamespace.has(className + namespace),
            50,
            3000
          );
        } catch (e) {
          // @todo test this case
          this.log &&
            console.log(
              logPrefix +
                chalk.red(` deleting bad in progress instance, error:`),
              e
            );
          this.inProgressByClassNameAndNamespace.delete(className + namespace);
          reject(`error waiting for ${className} ${namespace}: ${e}`);
          return;
        }
        this.log && console.log(`${logPrefix} returning awaited instance`);
        resolve(
          this.instancesByClassNameAndNamespace.get(className + namespace)
        );
        return;
      }

      // mark this class as in progress
      this.inProgressByClassNameAndNamespace.set(className + namespace, true);

      let instance;
      try {
        this.log && console.log(`${logPrefix} initiating class`);

        let _class = this.classes.find((c) => c.name == className);
        if (_class == undefined) {
          reject(
            `injector cannot find ${className} (namespace ${namespace}) amongst available classes: ${this.availableClassNames().join(
              ", "
            )}`
          );
          return;
        }
        let paramTypeNames = inputParamTypeNames(_class);
        let args = [];

        // iterate over arguments of dependencies of the class
        // being instantiated
        for (const t of paramTypeNames) {
          if (t == undefined) {
            reject(
              "undefined dependency for " +
                _class.name +
                ": " +
                paramTypeNames.join(", ")
            );
            return;
          }
          if (t == "Function") {
            // circular dependencies use functions to break the cycle
            args.push((serviceName: string) => {
              return new Promise(async (res) => {
                this.log &&
                  console.log(
                    `${logPrefix} function based injecting ${serviceName}`
                  );
                res(this.getInstance(serviceName, namespace));
              });
            });
            continue;
          }
          let handler = this.handlers.find((h) => h.typeName == t);
          if (!handler) {
            // Inject other services as dependencies
            this.log &&
              console.log(`${logPrefix} getting instance of dep ${t}`);
            let arg = await this.getInstance(t, namespace);
            args.push(arg);
          } else {
            // think of these as leaf nodes in the dependency graph
            // ie. they are not services but rather things like databases
            let i = await handler.handle(_class, namespace);
            args.push(i);
          }
        }

        instance = new _class(...args);
        try {
          if (!this.turnoffOnInit && instance._onInit) {
            if (typeof instance._onInit != "function") {
              let e = `service ${className} has a _onInit property but it is not a function`;
              this.log && console.error(chalk.red(`${logPrefix} ${e}`));
              reject(e);
            }
            this.log && console.log(`${logPrefix} calling _onInit`);
            await instance._onInit();
          }
        } catch (e) {
          this.log &&
            console.error(
              `${logPrefix} ` +
                chalk.red(
                  `error when calling _onInit of service "${_class.name}":`
                ),
              e
            );
        }
        this.instancesByClassNameAndNamespace.set(
          className + namespace,
          instance
        );
        this.log &&
          console.log(
            `${logPrefix} ${chalk.green("finished initiating class")}`
          );
      } catch (e) {
        // in case of error, remove the inProgress flag
        // @todo test this case
        this.log &&
          console.log(
            logPrefix +
              chalk.red(
                ` deleting failed initiated in progress instance, error:`
              ),
            e
          );
        this.inProgressByClassNameAndNamespace.delete(className + namespace);
        reject(e);
        return;
      }
      // finally block?
      this.inProgressByClassNameAndNamespace.delete(className + namespace);
      resolve(instance);
    });
  }
}

// be careful: One downside to throw is that it wouldn't result in a rejected promise if it was thrown from within an asynchronous callback, such as a setTimeout.
// https://stackoverflow.com/questions/33445415/javascript-promises-reject-vs-throw
//
// don't use throw in async code
function until(
  conditionFunction,
  intervalMs: number,
  maxMs: number
): Promise<void> {
  let elapsedMs = -intervalMs;
  const poll = (resolve, reject) => {
    if (conditionFunction()) resolve();
    else {
      intervalMs *= 1.1;
      elapsedMs += intervalMs;
      if (elapsedMs >= maxMs) {
        reject(`timed out after ${maxMs} ms`);
      }
      setTimeout((_) => poll(resolve, reject), intervalMs);
    }
  };

  return new Promise(poll);
}
