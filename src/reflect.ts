import "reflect-metadata";

import { ServiceMeta } from "./util.js";
import _ from "lodash";

// The decorators that are empty here only exist to trigger
// Reflect.getMetadata("design:paramtypes", ...) working properly
// To see the effect how having a decorator causes
// paramtypes to work play around with this gist:
// https://gist.github.com/crufter/5fac85071864c41775cc3079015aac71

/**
 * Makes the methods of a class available as API endpoints.
 * See `startServer` function or the `Registrator` class for a more manual
 * way to start a server.
 *
 * The constructor of your service
 * can accept the following list of allowed dependencies:
 *    - other services marked with this decorator
 *    - import { DataSource } from "typeorm" and other types handled by handlers
 *
 * Services should not panic if they are not supplied with all the dependencies
 * at the time of construction.
 */
export const Service = (): ClassDecorator => {
  return (target) => {
    // this does nothing, ignore it
    classDecoratorSaveParameterTypes(target);
  };
};

export interface EndpointOptions {
  /**
   * The types contained in higher order types (`Array`, `Promise` etc.) in the parameter list of an endpoint.
   *
   * Due to Typescript reflection limitations, contained types (ie. the `User` in `Promise<User>` or `string` in `string[]`/`Array<string>`) can't be automatically inferred.
   *
   * Example: If your endpoint is
   *
   * `async function getUser(userID: string): Promise<User>`
   *
   * then `returns` should be `User`.
   *
   * This option is only required to enable API documentation and API client generation.
   * See also the `containedTypes` option for a similar concept but for the endpoint parameter types.
   */
  returns: any;
}

/**
 * The `Endpoint` decorator makes a method visible to API docs and API client generation.
 * Your endpoint will function fine without this decorator.
 */
export const Endpoint = (options?: EndpointOptions): MethodDecorator => {
  return (target, propertyKey, descriptor) => {
    methodDecoratorSaveParameterTypes(options, target, propertyKey as string);
  };
};

export const Type = (): ClassDecorator => {
  return (target) => {
    // this does nothing, ignore it
    classDecoratorSaveParameterTypes(target);
  };
};

export interface EndpointInfo {
  target: any; // class
  methodName: string; // method name
  paramNames: any[];
  paramTypes: any[];
  returnType: any;
  options?: EndpointOptions;
}

export let classNameToEndpointInfo = new Map<string, EndpointInfo[]>();

export function getMethodsForService(className: string): EndpointInfo[] {
  let methods = getMethodParamsInfo(className);
  return methods;
}

function methodDecoratorSaveParameterTypes(
  options: EndpointOptions,
  target: any,
  key: string
) {
  const types = Reflect.getMetadata("design:paramtypes", target, key);
  const returnType = Reflect.getMetadata("design:returntype", target, key);
  const paramNames = methodDecoratorGetParamNames(target[key]);

  if (!classNameToEndpointInfo.has(target.constructor.name)) {
    classNameToEndpointInfo.set(target.constructor.name, []);
  }
  classNameToEndpointInfo.get(target.constructor.name).push({
    target: target.constructor,
    methodName: key,
    paramNames,
    paramTypes: types,
    returnType,
    options,
  });
}

export function getMethodParamsInfo(className: string) {
  return classNameToEndpointInfo.get(className);
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

let devNull = (a, b) => {};

// @todo types are not being extracted here unless method are decorated
// with @Endpoint (or any decorator)
function classDecoratorSaveParameterTypes(target: any) {
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
    devNull(types, paramNames);
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
