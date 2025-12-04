import { Lucia } from "lucia";
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "./db";
import { session, user } from "./schema";
import Elysia from "elysia";
import { Role } from "./types/role";

export function auth() {
  return (app: Elysia) => {
    const plugin = new Elysia({ name: "auth" })
      .use(db())
      .decorate(({ db }) => {
        const adapter = new DrizzlePostgreSQLAdapter(db, session, user);
        const auth = new Lucia(adapter, {
          sessionCookie: {
            attributes: {
              secure: !app.server?.development,
            },
          },
          getUserAttributes: (attributes) => ({
            studentOfficeId: attributes.studentOfficeId,
            role: attributes.role,
          }),
        });
        return { auth };
      })
      .derive({ as: "global" }, async ({ headers, auth }) => {
        const sessionId = auth.readSessionCookie(headers.cookie ?? "");
        if (!sessionId) {
          return { user: null, session: null };
        }
        return await auth.validateSession(sessionId);
      })
      .onBeforeHandle({ as: "global" }, ({ set, session, auth }) => {
        if (session && session.fresh) {
          set.headers["Set-Cookie"] = auth
            .createSessionCookie(session.id)
            .serialize();
        }
        if (!session) {
          set.headers["Set-Cookie"] = auth
            .createBlankSessionCookie()
            .serialize();
        }
      });

    return app.use(plugin);
  };
}

declare module "lucia" {
  interface Register {
    Lucia: Lucia<Record<never, never>, DatabaseUserAttributes>;
    UserId: number;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  studentOfficeId: number;
  role: Role;
}
