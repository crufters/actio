interface FieldData {
  target?: any;
  name?: string;
  required?: boolean;
  /**
   * Type returned by typescript reflection.
   * Do not set this, it's for internal usage.
   */
  type?: any;
  /**
   * Means field is an array. Value can be the type itself, ie: `arrayOf: 'User'` or a string ie. `arrayOf: 'User'`
   *
   * This is needed because array types can not be retrieved with typescript reflection, so we need some help from the caller:
   * https://stackoverflow.com/questions/35022658/how-do-i-get-array-item-type-in-typescript-using-the-reflection-api
   */
  arrayOf?: any;
}

let classMap = new Map<string, any>();
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
  fieldMap.forEach((value) => {
    ret.push(value);
  });
  return ret;
}

export const Field = (
  options?: Omit<FieldData, "target" | "type">
): PropertyDecorator => {
  return function (target, propertyKey) {
    classMap.set(target.constructor.name, target);

    let opts: FieldData = {
      target,
    };
    if (!options) {
      options = {};
    }
    if (options.arrayOf) {
      if (typeof options.arrayOf != "string") {
        opts.arrayOf = options.arrayOf.name;
      }
    }

    let name = target.constructor.name;

    if (options.arrayOf) {
      opts.type = "Array";
    }

    let t = Reflect.getMetadata("design:type", target, propertyKey);
    if (!t || t.name.length == 1) {
      throw `actio: Type for key '${String(
        propertyKey
      )}' in '${name}'' can not be determined. This is probably because it is not defined yet or source code transformators stripped the class name. Move type declarations around or specify the type in the 'type' property. This is a known shortcoming.`;
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
