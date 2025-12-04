import { Value } from "@sinclair/typebox/value";
import { Elysia, Static, t } from "elysia";

const envSchema = t.Object({
  POSTGRES_USER: t.String(),
  POSTGRES_PASSWORD: t.String(),
  POSTGRES_DB: t.String(),
  POSTGRES_HOST: t.String(),
  POSTGRES_PORT: t.Integer({ minimum: 1, maximum: 65535 }),

  PAGINATION_SIZE: t.Integer({ minimum: 2, maximum: 100 }),
});

export type Config = Static<typeof envSchema>;

export function config() {
  return new Elysia().decorate(() => {
    const env = Value.Convert(envSchema, process.env);
    const errors = [...Value.Errors(envSchema, env)];
    if (!errors.length) {
      return { config: Value.Cast(envSchema, env) };
    }

    const errorParts: Record<string, string> = {};
    for (const { path, message } of errors) {
      const fieldName = path.replace(/^\//, "");
      if (!errorParts[fieldName]) {
        errorParts[fieldName] = `  ${fieldName} : ${message}`;
        continue;
      }
      errorParts[fieldName] += `, ${message}`;
    }

    let error = "Invalid environment variables:\n";
    for (const part of Object.values(errorParts)) {
      error += `${part}\n`;
    }

    throw new Error(error);
  });
}
