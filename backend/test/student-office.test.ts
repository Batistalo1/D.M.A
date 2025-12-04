import { afterAll, describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../src/index";
import { newUserSession } from "./auth-utils";
import { studentOffice as studentOfficeTable } from "../src/schema";

const api = treaty(app);
const [sessionHeaders, removeUser] = await newUserSession();

describe("Elysia", () => {
  afterAll(removeUser);
  afterAll(async () => await app.decorator.db.delete(studentOfficeTable));

  const setCookies = (headers?: HeadersInit) => {
    let cookies = new Headers(headers).get("set-cookie")!;
    expect(cookies).not.toBeEmpty();
    sessionHeaders.cookie = cookies;
  };

  let studentOffices: any[] = [
    {
      schoolName: "School One - City One",
      description: "A valid description",
      profilePictureUrl: "http://example.com/profile.jpg",
      coverPictureUrl: "http://example.com/cover.jpg",
      domain: "bde.com",
    },
    {
      schoolName: "School One - City Two",
      description: "A valid description",
      profilePictureUrl: "http://example.com/profile.jpg",
      coverPictureUrl: "http://example.com/cover.jpg",
      domain: "bde.com",
    },
    {
      schoolName: "School Two",
      description: "A valid description",
      profilePictureUrl: "http://example.com/profile.jpg",
      coverPictureUrl: "http://example.com/cover.jpg",
      domain: "other-bde.com",
    },
  ];
  let user: any[] = [
    {
      login: "admin",
      email: "admin@admin.fr",
      password: "admin1234",
    },
    {
      login: "admin1",
      email: "admin1@admin.fr",
      password: "1admin1234",
    },
    {
      login: "admin2",
      email: "admin2@admin.fr",
      password: "2admin1234",
    },
  ];

  const getUserStudentOffice = (name: string, index: number) =>
    it(name, async () => {
      const { data, error } = await api["student-offices"].get({
        headers: sessionHeaders,
        query: {},
      });
      expect(error).toBeNil();
      expect(data).toEqual(expect.objectContaining(studentOffices[index]));
    });

  const setUserStudentOffice = (
    name: string,
    getStudentOfficeId: () => number,
    schoolEmail: string,
    domainMismatch: boolean = false,
  ) => {
    it(name, async () => {
      const { data: user, error: error1 } = await api.users.get({
        headers: sessionHeaders,
      });
      expect(error1).toBeNil();
      expect(user).not.toBeEmpty();

      const { id, verified, ...rest } = user!;
      const newUser = {
        login: rest.login,
        email: rest.email,
        fullName: rest.fullName!,
        phone: rest.phone!,
        profilePictureUrl: rest.profilePictureUrl!,
        schoolEmail,
        studentOfficeId: getStudentOfficeId(),
      };
      const { data, error: error2 } = await api.users.put(newUser, {
        headers: sessionHeaders,
      });
      if (domainMismatch) {
        expect(error2).not.toBeNil();
      } else {
        expect(error2).toBeNil();
      }
      expect(data).toBeEmpty();
    });
  };

  for (let studentOffice of studentOffices) {
    let i = studentOffices.indexOf(studentOffice);
    let Office = { studentOffice, user: user[i] };
    it("create a student office", async () => {
      const { data, error } = await api["student-offices"].post(Office, {
        headers: sessionHeaders,
      });
      expect(error).toBeNil();
      expect(data).toBeEmpty();
    });
  }

  it("get student offices by domain", async () => {
    const { data, error } = await api["student-offices"].get({
      query: { domain: "bde.com" },
    });
    expect(error).toBeNil();
    expect(data).toBeArray();
    expect(data).toHaveLength(2);
    const dataArray: any = data; // just so typescript doesn't complain
    for (let i = 0; i < dataArray.length; i++) {
      expect(dataArray![i]).toEqual(expect.objectContaining(studentOffices[i]));
      studentOffices[i] = dataArray![i];
    }
  });

  setUserStudentOffice(
    "update user student office - wrong email",
    () => studentOffices[1].id,
    "user@other-bde.com",
    true,
  );

  setUserStudentOffice(
    "update user student office",
    () => studentOffices[1].id,
    "user@bde.com",
  );

  getUserStudentOffice("get the user's current student office", 1);

  it("delete current user", async () => {
    const { data, error } = await api.users.delete(
      {},
      { headers: sessionHeaders },
    );
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  it("login admin", async () => {
    const credentials = {
      login: user[1].login,
      password: user[1].password,
    };
    const { data, error, headers } = await api.users.login.post(credentials);
    expect(error).toBeNil();
    expect(data).toBeEmpty();
    setCookies(headers);
  });

  it("update a student office", async () => {
    studentOffices[1].schoolName = "School One - City Two Updated";
    const { id, ...studentOffice } = studentOffices[1];
    const { data, error } = await api["student-offices"].put(studentOffice, {
      headers: sessionHeaders,
    });
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  getUserStudentOffice("get the updated student-offices", 1);

  for (let admin of user) {
    it("login admin", async () => {
      const credentials = {
        login: admin.login,
        password: admin.password,
      };
      const { data, error, headers } = await api.users.login.post(credentials);
      expect(error).toBeNil();
      expect(data).toBeEmpty();
      setCookies(headers);
    });
    it("delete current user", async () => {
      const { data, error } = await api.users.delete(
        {},
        { headers: sessionHeaders },
      );
      expect(error).toBeNil();
      expect(data).toBeEmpty();
    });
  }
});
