import { Elysia, Static, t } from "elysia";
import { Db, db } from "../db";
import { auth } from "../auth";
import { post as postTable } from "../schema";
import { desc, eq, and, isNotNull, gte } from "drizzle-orm";
import { Config, config } from "../config";
import { User } from "lucia";

const postUpdate = t.Object({
  title: t.String({ minLength: 1, maxLength: 255 }),
  content: t.String(isNotNull),
});

const postInsert = t.Composite([
  postUpdate,
  t.Object({
    pollOptions: t.Optional(
      t.Array(t.String({ minLength: 1, maxLength: 255 })),
    ),
  }),
]);

const postDelete = t.Object({
  id: t.Numeric({ minimum: 0 }),
});

abstract class PostService {
  static async getPosts(config: Config, db: Db, user: User, cursor?: number) {
    const paginationSize = Number(config.PAGINATION_SIZE);
    const whereClauses = [eq(postTable.studentOfficeId, user.studentOfficeId)];
    if (cursor) {
      whereClauses.push(gte(postTable.id, cursor));
    }

    let posts = await db.query.post.findMany({
      with: {
        votes: {
          columns: {
            optionIndex: true,
            userId: true,
          },
        },
      },
      where: and(...whereClauses),
      limit: paginationSize + 1,
      orderBy: [desc(postTable.createdOn)],
    });

    if (posts.length === 0) {
      return { posts: [], pagination: { hasNextPage: false } };
    }
    const hasNextPage = posts.length > paginationSize;
    const pagination = {
      hasNextPage,
      nextCursor: hasNextPage ? posts[0].id : undefined,
    };
    posts = pagination.hasNextPage ? posts.slice(1) : posts;

    type ParsedPost = Omit<(typeof posts)[0], "votes"> & {
      votes?: number[];
      userVoteOptionIndex?: number;
    };
    const parsedPosts = [];
    for (const post of posts) {
      const { votes, ...rest } = post;
      let parsedPost: ParsedPost = { ...rest };
      parsedPosts.push(parsedPost);
      if (!post.pollOptions) {
        continue;
      }

      parsedPost.votes = new Array(post.pollOptions.length).fill(0);
      for (const vote of votes) {
        parsedPost.votes[vote.optionIndex]++;
        if (vote.userId === user.id) {
          parsedPost.userVoteOptionIndex = vote.optionIndex;
        }
      }
    }

    return {
      posts: parsedPosts,
      pagination,
    };
  }

  static async addPost(db: Db, body: Static<typeof postInsert>, user: User) {
    const postItem = {
      studentOfficeId: user!.studentOfficeId,
      ...body,
    };
    return await db.insert(postTable).values(postItem);
  }

  static async updatePost(
    db: Db,
    body: Static<typeof postUpdate>,
    user: User,
    params: { id: string },
  ) {
    const post = {
      studentOfficeId: user!.studentOfficeId,
      updatedOn: new Date(),
      body,
    };

    return await db
      .update(postTable)
      .set(post)
      .where(eq(postTable.id, Number(params.id)));
  }

  static async deletePost(db: Db, id: number) {
    return await db.delete(postTable).where(eq(postTable.id, id));
  }
}

export function postController() {
  return new Elysia({ prefix: "/posts" })
    .use(db())
    .use(auth())
    .use(config())
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
          .get(
            "",
            async ({ config, db, user, query }) => {
              return await PostService.getPosts(
                config,
                db,
                user!,
                query.cursor,
              );
            },
            {
              query: t.Object({
                cursor: t.Optional(t.Numeric({ minimum: 0 })),
              }),
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
              app
                .post(
                  "",
                  async ({ db, body, user }) => {
                    return await PostService.addPost(db, body, user!);
                  },
                  { body: postInsert },
                )
                .put(
                  "/:id",
                  async ({ db, body, params, user }) => {
                    return await PostService.updatePost(
                      db,
                      body,
                      user!,
                      params,
                    );
                  },
                  { body: postUpdate },
                )
                .delete(
                  "/:id",
                  async ({ db, params }) => {
                    return await PostService.deletePost(db, params.id);
                  },
                  { params: postDelete },
                ),
          ),
    );
}
