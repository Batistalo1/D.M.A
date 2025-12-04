import { Elysia, t } from "elysia";
import { db } from "../db";
import { auth } from "../auth";
import { menuItem as menuItemTable } from "../schema";
import { eq } from "drizzle-orm";
import { Currency } from "../types/currency";

const menuItemInsert = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  currency: t.String({ format: "currency" }),
  price: t.String({ minimum: 0 }),
  pictureUrl: t.Optional(t.Nullable(t.String({ format: "uri" }))),
});

export function menuItemController() {
  return new Elysia({ prefix: "/menu-items" })
    .use(db())
    .use(auth())
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
          .get("", async ({ db, user }) => {
            return await db.query.menuItem.findMany({
              where: eq(menuItemTable.studentOfficeId, user!.studentOfficeId),
            });
          })
          .guard(
            {
              beforeHandle({ set, user }) {
                if (user!.role !== "admin") {
                  return (set.status = "Unauthorized");
                }
              },
            },
            (app) =>
              app
                .post(
                  "",
                  async ({ db, body, user }) => {
                    const { currency, ...rest } = body;
                    const menuItem = {
                      currency: currency as Currency,
                      studentOfficeId: user!.studentOfficeId,
                      ...rest,
                    };
                    return await db.insert(menuItemTable).values(menuItem);
                  },
                  { body: menuItemInsert },
                )
                .put(
                  "/:id",
                  async ({ db, body, params, user }) => {
                    const { currency, ...rest } = body;
                    const menuItem = {
                      currency: currency as Currency,
                      studentOfficeId: user!.studentOfficeId,
                      ...rest,
                    };
                    return await db
                      .update(menuItemTable)
                      .set(menuItem)
                      .where(eq(menuItemTable.id, Number(params.id)));
                  },
                  { body: menuItemInsert },
                )
                .delete("/:id", async ({ db, params }) => {
                  return await db
                    .delete(menuItemTable)
                    .where(eq(menuItemTable.id, Number(params.id)));
                }),
          ),
    );
}
