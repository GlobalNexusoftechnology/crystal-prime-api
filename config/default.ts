export default {
  origin: "*",
  accessTokenExpiresIn: 1440,
  refreshTokenExpiresIn: 1440,
  emailFrom: "developmentbyjuned@gmail.com",
  port: 5000,
  wsPort: 5017,
  postgresConfig: {
    host: "localhost",
    port: 5432,
    username: "satkar",
    password: "satkar",
    database: "satkar_prod",
  },
  frontendUrl: "https://erp.satkarsoftwares.com/",
};
