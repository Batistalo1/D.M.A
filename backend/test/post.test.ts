import { afterAll, describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../src/index";
import { newStudentOfficeWithUserSession } from "./auth-utils";

app.decorator.config.PAGINATION_SIZE = 2;

const api = treaty(app);
const [sessionHeaders, cleanDb] = await newStudentOfficeWithUserSession();

describe("Elysia", () => {
  afterAll(cleanDb);

  let postIds: any[] = [];

  let publications: any[] = [
    {
      title: "allez le Z",
      content: "appel au français, pour le Z",
      pollOptions: ["oui", "non"],
    },
    {
      title: "oui",
      content: "oui oui oui oui oui oui oui oui oui oui oui oui oui oui",
      pollOptions: ["oui", "non"],
    },
    {
      title: "non",
      content: "NON",
    },
  ];

  const checkPosts = (name: string) =>
    it(name, async () => {
      let hasNextPage = true;
      let queryParams: any = {};
      const posts = [];

      while (hasNextPage) {
        const { data, error } = await api.posts.get({
          headers: sessionHeaders,
          query: queryParams,
        });
        expect(error).toBeNil();
        expect(data).not.toBeNil();
        expect(data!.posts).not.toBeNil();
        const expectedLength = Math.min(
          app.decorator.config.PAGINATION_SIZE,
          publications.length - posts.length,
        );
        expect(data!.posts).toHaveLength(expectedLength);
        for (let i = 0; i > data!.posts.length; i++) {
          expect(data!.posts[i]).toEqual(
            expect.objectContaining(publications[i + publications.length]),
          );
        }
        posts.push(...data!.posts);

        expect(data!.pagination).not.toBeNil();
        expect(data!.pagination.hasNextPage).toEqual(
          posts.length < publications.length,
        );
        hasNextPage = data!.pagination.hasNextPage;
        queryParams = {
          cursor:
            "nextCursor" in data!.pagination
              ? data!.pagination.nextCursor
              : undefined,
        };
        postIds = postIds.concat(posts.map((post) => post.id));
      }
      publications = posts;
    });

  for (const post of publications) {
    it("create posts", async () => {
      const { data, error } = await api.posts.post(post, {
        headers: sessionHeaders,
      });
      expect(error).toBeNil();
      expect(data).toBeEmpty();
    });
  }

  checkPosts("get posts");

  it("post a vote", async () => {
    postIds.shift();
    postIds.shift();
    const { data, error } = await api.votes.post(
      {
        postId: parseInt(postIds[0]),
        optionIndex: 1,
      },
      {
        headers: sessionHeaders,
      },
    );
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  it("get a post with vote", async () => {
    let queryParams = {};
    const { data, error } = await api.posts.get({
      headers: sessionHeaders,
      query: queryParams,
    });
    expect(error).toBeNil();
    expect(data).not.toBeNil();
    expect(data!.posts[0].votes).toEqual([0, 1]);
    expect(data!.posts[0].userVoteOptionIndex).toEqual(1);
  });

  it("update a post", async () => {
    publications[0].title = "Allez marine";
    let {
      id,
      studentOfficeId,
      updatedOn,
      createdOn,
      pollOptions,
      votes,
      ...newpost
    } = publications[0];
    const { data, error } = await api
      .posts({
        id: id,
      })
      .put(newpost, {
        headers: sessionHeaders,
      });
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  checkPosts("get updated posts");

  it("delete a vote", async () => {
    const { data, error } = await api.votes.delete(
      {
        postId: parseInt(postIds[0]),
      },
      {
        headers: sessionHeaders,
      },
    );
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  for (let i = 0; i < publications.length; i++) {
    it("delete a post", async () => {
      const { data, error } = await api
        .posts({
          id: publications[i].id,
        })
        .delete(
          {},
          {
            headers: sessionHeaders,
          },
        );
      expect(error).toBeNil();
      expect(data).toBeEmpty();
      if (i === publications.length - 1) {
        publications = [];
      }
    });
  }

  checkPosts("get posts after delete");
});
