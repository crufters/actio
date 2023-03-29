import "reflect-metadata";

import { ServiceMeta } from "./util.js";
import _ from "lodash";

// The decorators that are empty here only exist to trigger
// Reflect.getMetadata("design:paramtypes", ...) working properly
// To see the effect how having a decorator causes
// paramtypes to work play around with this gist:
// https://gist.github.com/crufter/5fac85071864c41775cc3079015aac71

/**
 * Marks a class as a service. The constructor of your endpoint
 * can accept the following list of allowed dependencies:
 *    - other services marked with this decorator
 *    - import { DataSource } from "typeorm"
 */
export const Service = (): ClassDecorator => {
  return (target) => {
    // console.log(Reflect.getMetadata("design:paramtypes", target));
  };
};

let unexposedMethods = new Set<string>();

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
  // @todod why this filter is needed I'm not sure
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
