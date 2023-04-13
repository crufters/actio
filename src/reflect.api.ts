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

// this method is named JSON because
// types are returned as strings and not actual
// types (eg. [Function Array] becomes "Array")
//
// this way the return values is ready to be JSON stringified
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
        options: {
          ...endpointInfo.options,
        },
      };
      newInfo.paramTypes = newInfo.paramTypes.map((type) => {
        return type.name;
      });
      if (newInfo.options.returns) {
        newInfo.options.returns = newInfo.options.returns?.name;
      }

      api.services[serviceName][endpointInfo.methodName] = {
        info: newInfo,
        paramOptions: endpointInfo.paramTypes.map((_, index) => {
          let ret = {
            ...getParamOptions(
              endpointInfo.target,
              endpointInfo.methodName,
              index
            ),
          };
          if (ret.type) {
            ret.type = ret.type?.name;
          }
          return ret;
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
      data.type = data.type?.name;
      if (data.hint) {
        data.hint = data.hint?.name;
      }
      delete data.target;
      api.types[className][field.name] = {
        data: data,
      };
    });
  });

  return api;
}
