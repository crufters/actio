import "reflect-metadata";

import { ServiceMeta } from "./util.js";
import _ from "lodash";

// The decorators that are empty here only exist to trigger
// Reflect.getMetadata("design:paramtypes", ...) working properly
// To see the effect how having a decorator causes
// paramtypes to work play around with this gist:
// https://gist.github.com/crufter/5fac85071864c41775cc3079015aac71

/**
 * Marks a class as a service. The constructor of your service
 * can accept the following list of allowed dependencies:
 *    - other services marked with this decorator
 *    - import { DataSource } from "typeorm" and other types handled by handlers
 *
 * Services should not panic if they are not supplied with all the dependencies
 * at the time of construction.
 *
 * The endpoints of a service are its method:
 * - Method names starting with underscore are callbacks to specific events,
 * see examples below.
 */
export const Service = (): ClassDecorator => {
  return (target) => {
    classDecoratorLogParameterTypes(target);
  };
};

export const Endpoint = (): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    methodDecoratorLogParameterTypes(target, propertyKey as string);
  };
};

function methodDecoratorLogParameterTypes(target: any, key: string) {
  const types = Reflect.getMetadata("design:paramtypes", target, key);
  const paramNames = methodDecoratorGetParamNames(target[key]);
  console.log(
    `mmm Method ${key} parameter types:`,
    paramNames.map((name, i) => `${name}: ${types[i].name} ${types[i]}`).join(", ")
  );
}

function methodDecoratorGetParamNames(func: Function) {
  const funcStr = func
    .toString()
    .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, "");
  const result = funcStr
    .slice(funcStr.indexOf("(") + 1, funcStr.indexOf(")"))
    .match(/([^\s,]+)/g);
  return result === null ? [] : result;
}

// @todo types are not being extracted here
function classDecoratorLogParameterTypes(target: any) {
  const methods = Object.getOwnPropertyNames(target.prototype);
  for (const method of methods) {
    const descriptor = Object.getOwnPropertyDescriptor(
      target.prototype,
      method
    );
    if (!descriptor || typeof descriptor.value !== "function") {
      continue;
    }
    const types = Reflect.getMetadata(
      "design:paramtypes",
      target.prototype,
      method
    );
    const paramNames = classDecoratorGetParamNames(descriptor.value);
    console.log(
      `${target.name} method ${method} parameter types:`,
      paramNames
        .map((name, i) => `${name}: ${types ? types[i].name : "not found"}`)
        .join(", ")
    );
  }
}

function classDecoratorGetParamNames(func: Function) {
  const funcStr = func
    .toString()
    .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, "");
  const result = funcStr
    .slice(funcStr.indexOf("(") + 1, funcStr.indexOf(")"))
    .match(/([^\s,]+)/g);
  return result === null ? [] : result;
}

let unexposedMethods = new Set<string>();

/**
 * Class methods decorated with the `@Unexposed()` decorator will not be
 * exposed as HTTP endpoints.
 */
export function Unexposed() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    unexposedMethods.add(`${target.constructor.name}.${propertyKey}`);
  };
}

export function isUnexposed(_class: any, methodName: string): boolean {
  return unexposedMethods.has(`${_class.name}.${methodName}`);
}

let rawMethods = new Set<string>();

/**
 * Methods annotated with the `@Raw()` decorator will be registered as
 * direct HTTP methods and have access to HTTP request and response types.
 * A prime example of this is a file upload endpoint.
 *
 * Methods that are not annotated with `@Raw()` will only have access to their JSON request data.
 * That is favorable to raw HTTP methods as it is cleaner, enables testing etc.
 */
export function Raw() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    rawMethods.add(`${target.constructor.name}.${propertyKey}`);
  };
}

export function isRaw(_class: any, methodName: string): boolean {
  return rawMethods.has(`${_class.name}.${methodName}`);
}

/** Returns the argument types of a class type as a string slice
 * make sure the type you pass into this has been decorated with a decorator
 * otherwise Reflect can't inspec its types (see comments at the top of this package).
 */
export function inputParamTypeNames(t: any): string[] {
  return inputParamTypes(t).map((t) => t.name);
}

export function inputParamTypes(t: any): any[] {
  let types = Reflect.getMetadata("design:paramtypes", t);
  if (!types) {
    return [];
  }
  // @todo why this filter is needed I'm not sure
  // there is likely a hidden bug here. investigate.
  return types.filter((t) => t !== undefined);
}

export function getMeta(serviceClass: any): ServiceMeta {
  let instance = new serviceClass();
  return instance.meta;
}

/**
 * Recursively returns all dependencies of a class (ie. also
 * dependencies of dependencies), flattened into a single array.
 *
 * @param serviceClass the class to get the dependencies of
 * @returns a list of service classes
 */
export function getDependencyGraph(_class: any): any[] {
  let deps = inputParamTypes(_class);
  deps.forEach((d) => deps.push(getDependencyGraph(d)));
  return _.uniqBy(_.flatten(deps), (d) => d.name);
}
