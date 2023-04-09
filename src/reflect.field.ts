export interface FieldData {
  target?: any;
  name?: string;
  required?: boolean;
  /**
   * Type returned by typescript reflection.
   * Do not set this, it's for internal usage.
   */
  type?: any;
  /**
   * This is needed because array types can not be retrieved with typescript reflection, so we need some help from the caller:
   * https://stackoverflow.com/questions/35022658/how-do-i-get-array-item-type-in-typescript-using-the-reflection-api
   */
  arrayOf?: any;
}

export let classMap = new Map<string, any>();
let fieldMap = new Map<string, FieldData[]>();

export function listFields(target: any | string): FieldData[] {
  let key = target;
  if (typeof target != "string") {
    key = target.constructor.name;
  }
  if (!fieldMap.has(key)) {
    return [];
  }
  return fieldMap.get(key);
}

export function listClasses(): any[] {
  let ret = [];
  classMap.forEach((value) => {
    ret.push(value);
  });
  return ret;
}

/**
 * Makes properties available to the Actio runtime for API docs and API client generation.
 * The parent class is also registered with the Actio runtime, but only the fields that are decorated with @Field are available.
 */
export const Field = (
  options?: Omit<FieldData, "target" | "type">
): PropertyDecorator => {
  return function (target, propertyKey) {
    classMap.set(target.constructor.name, target.constructor);

    let opts: FieldData = {
      target,
    };
    if (!options) {
      options = {};
    }
    opts.arrayOf = options.arrayOf;
    let name = target.constructor.name;

    let t = Reflect.getMetadata("design:type", target, propertyKey);
    if (!t) {
      throw `actio: Type for key '${String(
        propertyKey
      )}' in '${name}'' can not be determined.`;
    }
    opts.type = t;

    let list = fieldMap.get(name);
    if (!list) {
      list = [];
      fieldMap.set(name, list);
    }
    opts.name = options.name || String(propertyKey);

    list.push(opts);
  };
};

interface ParamOptions {
  /**
   * The type contained in higher order types (`Array`, `Promise` etc.) in the parameter list of an endpoint.
   *
   * Due to Typescript reflection limitations, contained types (ie. the `User` in `Promise<User>` or `string` in `string[]`/`Array<string>`) can't be automatically inferred.
   *
   * Example: If your endpoint is
   *
   * `async function getComments(userIDs: string[], subs: SubID[], isVerified?: true): Promise<Comments[]>`
   *
   * then containedTypes should be `[string, SubID]`.
   *
   * This option is only required to enable API documentation and API client generation.
   * See also the `returns` option for a similar concept but for the endpoint return type.
   **/
  type: any | any[];
}

/**
 * The Param parameter decorator is used to specify the type of a parameter in an endpoint.
 * for higher order types. See the `type` option in `ParamOptions` for more information.
 */
export function Param(options: ParamOptions) {
  return function (target: any, methodName: string, parameterIndex: number) {
    const key = `__param_${methodName}_${parameterIndex}`;
    target[key] = options;
  };
}

export function getParamOptions(
  target: any,
  methodName: string,
  parameterIndex: number
) {
  const key = `__param_${methodName}_${parameterIndex}`;
  return target[key];
}
