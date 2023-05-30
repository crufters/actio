import { getAPIJSON } from "../../reflect.api.js";

export default async (request: any): Promise<any> => {
  return getAPIJSON();
};
