import { Elysia, Static, t } from "elysia";
import { Db, db } from "../db";
import { auth } from "../auth";
import {
  user as userTable,
  studentOffice as studentOfficeTable,
} from "../schema";
import { or, eq, ne, and, InferSelectModel } from "drizzle-orm";
import {
  NotFoundDataError,
  AlreadyTakenDataError,
  MismatchDataError,
} from "../types/errors";
import { createId } from "@paralleldrive/cuid2";
import { Lucia, Session } from "lucia";

const login = t.String({ format: "username", minLength: 3, maxLength: 30 });
const email = t.String({ format: "email" });
const phone = t.String({ format: "e.164" });
const password = t.String({ minLength: 8 });

const userCredentials = t.Object({
  // these 3 formats are mutually exclusive
  login: t.Union([login, email, phone]),
  password,
});

const userBase = t.Object({
  login,
  email,
  schoolEmail: t.Optional(t.Nullable(t.String({ format: "email" }))),
  // WARN: non latin names are not supported for now
  fullName: t.String({ minLength: 1, format: "latinName" }),
  phone: phone,
  profilePictureUrl: t.Optional(t.Nullable(t.String({ format: "uri" }))),
});

const userCreate = t.Composite([
  userBase,
  t.Object({
    password,
    studentOfficeId: t.Optional(t.Number()),
  }),
]);

const userUpdate = t.Composite([
  userBase,
  t.Object({
    studentOfficeId: t.Optional(t.Number()),
  }),
]);

const passwordUpdate = t.Object({
  password,
});

abstract class UserService {
  static async register(
    db: Db,
    auth: Lucia,
    session: Session | null,
    user: Static<typeof userCreate>,
  ) {
    if (session) {
      auth.invalidateSession(session.id);
    }

    const passwordHash = await Bun.password.hash(user.password);
    const newUser = {
      ...user,
      passwordHash,
    };

    await this.checkStudentOffice(db, user);
    await this.checkUserUniqueFields(db, user);

    // possible concurrency problem with the check above,
    // the probability is extremly low so we'll take the chance
    await db.insert(userTable).values(newUser);
  }

  static async login(
    db: Db,
    auth: Lucia,
    session: Session | null,
    credentials: Static<typeof userCredentials>,
  ): Promise<Session> {
    if (session) {
      auth.invalidateSession(session.id);
    }

    const user = await db.query.user.findFirst({
      where: or(
        eq(userTable.login, credentials.login),
        eq(userTable.email, credentials.login),
        eq(userTable.phone, credentials.login),
      ),
    });
    if (!user) {
      throw new NotFoundDataError("credentials", ["/login"]);
    }

    const validPassword = await Bun.password.verify(
      credentials.password,
      user.passwordHash,
    );
    if (!validPassword) {
      throw new MismatchDataError("credentials", ["/login", "/password"]);
    }

    return auth.createSession(user.id, {}, { sessionId: createId() });
  }

  static async logout(auth: Lucia, session: Session) {
    await auth.invalidateSession(session.id);
  }

  static async get(
    db: Db,
    userId: number,
  ): Promise<
    | Omit<
        InferSelectModel<typeof userTable>,
        "passwordHash" | "studentOfficeId"
      >
    | undefined
  > {
    return await db.query.user.findFirst({
      where: eq(userTable.id, userId),
      columns: {
        passwordHash: false,
        studentOfficeId: false,
      },
    });
  }

  static async updatePassword(db: Db, id: number, password: string) {
    const passwordHash = await Bun.password.hash(password);
    await db
      .update(userTable)
      .set({ passwordHash })
      .where(eq(userTable.id, id));
  }

  static async update(
    db: Db,
    user: Static<typeof userUpdate> & { id: number },
  ) {
    await this.checkStudentOffice(db, user);
    await this.checkUserUniqueFields(db, user);

    // possible concurrency problem with the check above,
    // the probability is extremly low so we'll take the chance
    await db.update(userTable).set(user).where(eq(userTable.id, user.id));
  }

  static async delete(db: Db, userId: number) {
    await db.delete(userTable).where(eq(userTable.id, userId));
  }

  private static async checkUserUniqueFields(
    db: Db,
    user: Static<typeof userUpdate> & { id?: number },
  ) {
    const orClauses = [
      eq(userTable.login, user.login),
      eq(userTable.email, user.email),
      eq(userTable.phone, user.phone),
    ];
    if (user.schoolEmail) {
      orClauses.push(eq(userTable.schoolEmail, user.schoolEmail));
    }
    let whereClause = or(...orClauses);
    if (user.id) {
      whereClause = and(whereClause, ne(userTable.id, user.id));
    }

    const matches = await db.query.user.findMany({
      where: whereClause,
      columns: {
        login: true,
        email: true,
        schoolEmail: true,
        phone: true,
      },
    });
    if (matches.length === 0) {
      return;
    }

    let error = new AlreadyTakenDataError("user", []);
    for (const match of matches) {
      for (const [key, value] of Object.entries(match)) {
        if (user[key as keyof typeof user] === value) {
          error.properties.push(`/${key}`);
        }
      }
    }
    throw error;
  }

  private static async checkStudentOffice(
    db: Db,
    user: Static<typeof userUpdate>,
  ) {
    if (user.schoolEmail && user.studentOfficeId) {
      const schoolEmailDomain = user.schoolEmail.split("@")[1];
      const studentOffice = await db.query.studentOffice.findFirst({
        where: and(
          eq(studentOfficeTable.domain, schoolEmailDomain),
          eq(studentOfficeTable.id, user.studentOfficeId),
        ),
      });
      if (!studentOffice) {
        throw new NotFoundDataError("user", [
          "/studentOfficeId",
          "/schoolEmail",
        ]);
      }

      return;
    }

    if (user.schoolEmail || user.studentOfficeId) {
      throw new MismatchDataError("user", ["/studentOfficeId", "/schoolEmail"]);
    }
  }
}

export function userController() {
  return new Elysia({ prefix: "/users" })
    .use(db())
    .use(auth())
    .post(
      "/register",
      async ({ body, db, auth, session }) => {
        await UserService.register(db, auth, session, body);
      },
      {
        body: userCreate,
      },
    )
    .post(
      "/login",
      async ({ body, set, db, auth, session }) => {
        session = await UserService.login(db, auth, session, body);
        set.headers["Set-Cookie"] = auth
          .createSessionCookie(session.id)
          .serialize();
      },
      { body: userCredentials },
    )
    .guard(
      {
        beforeHandle({ set, session }) {
          if (!session) {
            return (set.status = "Unauthorized");
          }
        },
      },
      (app) =>
        app
          .post("/logout", async ({ set, auth, session }) => {
            await UserService.logout(auth, session!);
            set.headers["Set-Cookie"] = auth
              .createBlankSessionCookie()
              .serialize();
          })
          .get("", async ({ db, user }) => {
            return UserService.get(db, user!.id);
          })
          .put(
            "",
            async ({ body, db, user }) => {
              const updatedUser = { id: user!.id, ...body };
              await UserService.update(db, updatedUser);
            },
            { body: userUpdate },
          )
          .put(
            "/password",
            async ({ body, db, user }) => {
              await UserService.updatePassword(db, user!.id, body.password);
            },
            { body: passwordUpdate },
          )
          .delete("", async ({ db, user }) => {
            await UserService.delete(db, user!.id);
          }),
    );
}
