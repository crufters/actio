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
   * Type hint. This is needed because array types can not be retrieved with typescript reflection, so we need some help from the caller:
   * https://stackoverflow.com/questions/35022658/how-do-i-get-array-item-type-in-typescript-using-the-reflection-api
   */
  hint?: any;
}

export let classMap = new Map<string, any>();
export let fieldMap = new Map<string, FieldData[]>();

export function listFields(target: any | string): FieldData[] {
  let key = target;
  if (typeof target != "string") {
    key = target.constructor.name;
  }
  if (!fieldMap.has(key)) {
    return [];
  }
  return fieldMap.get(key).map((opts) => {
    let ret = {
      ...opts,
    };
    // support lambda hints ie. @Field({hint: () => User})
    if (ret.hint?.name == "hint") {
      ret.hint = ret.hint();
    }
    return ret;
  });
}

export function listClasses(): any[] {
  let ret = [];
  classMap.forEach((value) => {
    ret.push(value);
  });
  return ret;
}

export type FieldOptions = Omit<FieldData, "target" | "type">;

/**
 * Field is for data class properties. Makes properties available to the Actio runtime for API docs and API client generation.
 * The parent class is also registered with the Actio runtime, but only the fields that are decorated with @Field are available.
 */
export const Field = (options?: FieldOptions): PropertyDecorator => {
  return function (target, propertyKey) {
    classMap.set(target.constructor.name, target.constructor);

    let opts: FieldData = {
      target,
    };
    if (!options) {
      options = {};
    }
    opts.hint = options.hint;

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

export interface ParamOptions {
  /**
   * The type contained in higher order types (`Array`, `Promise` etc.) in the parameter list of an endpoint.
   *
   * Due to Typescript reflection limitations, contained types (ie. the `User` in `Promise<User>` or `string` in `string[]`) can't be automatically inferred.
   *
   * Example: If your endpoint is
   *
   * `async function getComments(@Param({type: string}) userIDs: string[]): Promise<Comment[]>`
   *
   * This option and accurate type information is only required to enable API documentation and API client generation.
   **/
  type: any | any[];
}

// key format: <className>_<methodName>_<parameterIndex>
// key example: CommentService_getComments_0
let paramOptions = new Map<string, ParamOptions>();

/**
 * The Param parameter decorator is used to specify the type of a parameter for an endpoint when the
 * endpoint accepts higher order types (eg. arrays). See the `type` option in `ParamOptions` for more information.
 */
export function Param(options: ParamOptions) {
  return function (target: any, methodName: string, parameterIndex: number) {
    const key = `${target.constructor.name}_${methodName}_${parameterIndex}`;
    paramOptions.set(key, options);
  };
}

export function getParamOptions(
  target: any,
  methodName: string,
  parameterIndex: number
): ParamOptions {
  const key = `${target.name}_${methodName}_${parameterIndex}`;
  return paramOptions.get(key);
}
