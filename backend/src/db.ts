import postgres from "postgres";
import { PostgresJsDatabase, drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import { config } from "./config";
import Elysia from "elysia";

export function db() {
  return new Elysia({ name: "db" }).use(config()).decorate(({ config }) => {
    const pg = postgres({
      user: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      db: config.POSTGRES_DB,
      host: config.POSTGRES_HOST,
      port: config.POSTGRES_PORT,
    });

    return { db: drizzle(pg, { schema }) };
  });
}

export type Db = PostgresJsDatabase<typeof schema>;
