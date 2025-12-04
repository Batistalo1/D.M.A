import { Elysia, t } from "elysia";
import { db } from "../db";
import { auth } from "../auth";
import { vote as voteTable } from "../schema";
import { and, eq } from "drizzle-orm";

const insertVote = t.Object({
  optionIndex: t.Integer({ minimum: 0 }),
  postId: t.Integer(),
});

const deleteVoteBody = t.Object({
  postId: t.Integer(),
});

export function voteController() {
  return new Elysia({ prefix: "/votes" })
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
          .post(
            "",
            async ({ db, body, user }) => {
              const { optionIndex, postId } = body;
              return await db
                .insert(voteTable)
                .values({
                  userId: user!.id,
                  postId,
                  optionIndex,
                })
                .onConflictDoUpdate({
                  target: [voteTable.userId, voteTable.postId],
                  set: { optionIndex },
                });
            },
            { body: insertVote },
          )
          .delete(
            "",
            async ({ db, body, user }) => {
              const { postId } = body;
              return await db
                .delete(voteTable)
                .where(
                  and(
                    eq(voteTable.userId, user!.id),
                    eq(voteTable.postId, postId),
                  ),
                );
            },
            { body: deleteVoteBody },
          ),
    );
}
