require("dotenv").config();
import "reflect-metadata";
import { DataSource } from "typeorm";
import config from "config";

const postgresConfig = config.get<{
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}>("postgresConfig");

const isProd = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  ...postgresConfig,
  type: "postgres",
  // TODO: make it false and use migration later
  synchronize: true, // Automatically sync in development
  logging: process.env.NODE_ENV === "development", // Log SQL queries in development
  entities: [`${isProd ? "build" : "src"}/entities/**/*.entity{.ts,.js}`],
  migrations: [`${isProd ? "build" : "src"}/migrations/**/*{.ts,.js}`],
  subscribers: [`${isProd ? "build" : "src"}/subscribers/**/*{.ts,.js}`],
  // ...(!isProd && {
  ssl: {
    rejectUnauthorized: false, // Set to true in production with a valid certificate
  },
  // }),
});
