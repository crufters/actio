export const env = {
  isProd: process.env.IS_PRODUCTION,
  selfAddress: process.env.ACTIO_SELF_ADDRESS,
  postgres: {
    connectionName: process.env.CONNECTION_NAME,
    dbUser: process.env.SQL_USER,
    dbPassword: process.env.SQL_PASSWORD,
    dbName: process.env.SQL_NAME,
  },
};

export default env;
