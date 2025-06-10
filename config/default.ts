export default {
  origin: '*',
  accessTokenExpiresIn: 1440,
  refreshTokenExpiresIn: 1440,
  emailFrom: 'developmentbyjuned@gmail.com',
  port: 5000,
  wsPort: 5001,
  postgresConfig: {
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'satkar_db',
  },
  frontendUrl: 'http://localhost:3000',
};
