import { classNameToParamInfo } from "./reflect.js";
import { FieldData } from "./reflect.field.js";
import { classMap } from "./reflect.field.js";

interface APIJSON {
  types: { [typeName: string]: FieldData[] };
  services: {
    [serviceName: string]: {
      [methodName: string]: {
        paramTypes: string[];
        containedTypes: string[];
        returns: string;
      };
    };
  };
}

export function getAPIJSON(): APIJSON {
  let api: APIJSON = {
    services: {},
    types: {},
  };

  classNameToParamInfo.forEach((paramsInfo) => {
    paramsInfo.forEach((paramInfo) => {
      const { target, methodName, paramNames, paramTypes, returnType } =
        paramInfo;
      const serviceName = target.name;
      if (!api.services[serviceName]) {
        api.services[serviceName] = {};
      }
      api.services[serviceName][methodName] = {
        paramTypes: [],
        containedTypes: [],
        returns: returnType.name,
      };
      paramNames.forEach((paramName, i) => {
        api.services[serviceName][methodName].paramTypes.push(
          paramTypes[i].name
        );
      });
    });
  });

  classMap.forEach((fields, className) => {
    api.types[className] = fields;
  });

  return api;
}
