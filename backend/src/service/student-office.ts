import { Elysia, Static, t } from "elysia";
import { Db, db } from "../db";
import { auth } from "../auth";
import {
  studentOffice as studentOfficeTable,
  user as userTable,
} from "../schema";
import { eq } from "drizzle-orm";

const studentOffice = t.Object({
  schoolName: t.String({ minLength: 3 }),
  description: t.Optional(t.Nullable(t.String())),
  profilePictureUrl: t.Optional(t.Nullable(t.String({ format: "uri" }))),
  coverPictureUrl: t.Optional(t.Nullable(t.String({ format: "uri" }))),
  domain: t.String({ format: "hostname" }),
});

const UserAdmin = t.Object({
  login: t.String({ format: "username", minLength: 3, maxLength: 30 }),
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
});

const studentOfficeAndUserCreate = t.Object({
  studentOffice: studentOffice,
  user: UserAdmin,
});

const studentOfficeGet = t.Object({
  domain: t.Optional(t.String({ minLength: 3 })),
});

abstract class StudentOfficeService {
  static async postStudentOffice({
    body,
    db,
  }: {
    body: Static<typeof studentOfficeAndUserCreate>;
    db: Db;
  }) {
    const { studentOffice, user } = body;
    const passwordHash = await Bun.password.hash(user.password);

    const newUser = {
      ...user,
      role: "admin" as const,
      passwordHash,
    };

    await db.transaction(async (tx) => {
      const studentOfficeId = await tx
        .insert(studentOfficeTable)
        .values(studentOffice)
        .returning({ id: studentOfficeTable.id });

      await tx
        .insert(userTable)
        .values({ ...newUser, studentOfficeId: studentOfficeId[0].id });
    });
  }
}

export function studentOfficeController() {
  return new Elysia({ prefix: "/student-offices" })
    .use(db())
    .use(auth())
    .get(
      "",
      async ({ set, query, db, user }) => {
        if (query.domain) {
          return await db.query.studentOffice.findMany({
            where: eq(studentOfficeTable.domain, query.domain!),
          });
        }

        if (!user) {
          return (set.status = "Unauthorized");
        }

        return await db.query.studentOffice.findFirst({
          where: eq(studentOfficeTable.id, user!.studentOfficeId),
        });
      },
      {
        query: studentOfficeGet,
      },
    )
    .guard(
      {
        beforeHandle({ set, user }) {
          if (!user) {
            return (set.status = "Unauthorized");
          }
        },
      },
      (app) =>
        app
          .post(
            "",
            async ({ body, db }) => {
              await StudentOfficeService.postStudentOffice({ body, db });
            },
            {
              body: studentOfficeAndUserCreate,
            },
          )
          .guard(
            {
              beforeHandle({ set, user }) {
                if (user!.role !== "admin") {
                  return (set.status = "Unauthorized");
                }
              },
            },
            (app) =>
              app.put(
                "",
                async ({ body, db, user }) => {
                  await db
                    .update(studentOfficeTable)
                    .set(body)
                    .where(eq(studentOfficeTable.id, user!.studentOfficeId));
                },
                {
                  body: studentOffice,
                },
              ),
          ),
    );
}
