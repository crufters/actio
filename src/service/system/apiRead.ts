import { DataSource } from "typeorm";
import { getAPIJSON } from "../../reflect.api.js";

export default async (connection: DataSource, request: any): Promise<any> => {
  return getAPIJSON();
};
