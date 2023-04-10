import { classNameToEndpointInfo, EndpointInfo } from "./reflect.js";
import { FieldData, getParamOptions, ParamOptions } from "./reflect.field.js";
import { fieldMap } from "./reflect.field.js";

interface APIJSON {
  types: {
    [typeName: string]: {
      [fieldName: string]: {
        data: FieldData;
      };
    };
  };
  services: {
    [serviceName: string]: {
      [methodName: string]: {
        info?: EndpointInfo;
        // length equals to `info.paramTypes` field
        // contains null values for no options
        paramOptions: ParamOptions[];
      };
    };
  };
}

export function getAPIJSON(): APIJSON {
  let api: APIJSON = {
    services: {},
    types: {},
  };

  classNameToEndpointInfo.forEach((endpointInfos) => {
    endpointInfos.forEach((endpointInfo) => {
      const serviceName = endpointInfo.target.name;
      if (!api.services[serviceName]) {
        api.services[serviceName] = {};
      }
      let newInfo = {
        ...endpointInfo,
      };
      newInfo.paramTypes = newInfo.paramTypes.map((type) => {
        return type.name;
      });
      api.services[serviceName][endpointInfo.methodName] = {
        info: newInfo,
        paramOptions: endpointInfo.paramNames.map((_, index) => {
          return getParamOptions(
            endpointInfo.target,
            endpointInfo.methodName,
            index
          );
        }),
      };
    });
  });

  fieldMap.forEach((fields, className) => {
    fields.forEach((field) => {
      if (!api.types[className]) {
        api.types[className] = {};
      }
      let data = {
        ...field,
      };
      delete data.target;
      api.types[className][field.name] = {
        data: data,
      };
    });
  });

  return api;
}
