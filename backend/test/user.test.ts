import { describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../src/index";

const api = treaty(app);

describe("Elysia", () => {
  let user: any = {
    login: "testastos",
    email: "testastos@mail.com",
    password: "super_secret",
    fullName: "Tes O'Tastos Jr.",
    phone: "+33670661299",
  };

  let sessionHeaders: Record<string, string> = {};
  const setCookies = (headers?: HeadersInit) => {
    let cookies = new Headers(headers).get("set-cookie")!;
    expect(cookies).not.toBeEmpty();
    sessionHeaders.cookie = cookies;
  };

  it("register a user", async () => {
    const { data, error } = await api.users.register.post(user);
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  it("login", async () => {
    const credentials = {
      login: user.login,
      password: user.password,
    };
    const { data, error, headers } = await api.users.login.post(credentials);
    expect(error).toBeNil();
    expect(data).toBeEmpty();
    setCookies(headers);
  });

  it("get current user", async () => {
    const { data, error } = await api.users.get({ headers: sessionHeaders });
    expect(error).toBeNil();
    const { password, ...userSafe } = user;
    expect(data).toEqual(expect.objectContaining(userSafe));
  });

  it("update current user", async () => {
    user.phone = "+338879056322";
    const { password, ...userUpdate } = user;
    const { data, error } = await api.users.put(userUpdate, {
      headers: sessionHeaders,
    });
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  it("get current user", async () => {
    const { data, error } = await api.users.get({ headers: sessionHeaders });
    expect(error).toBeNil();
    const { password, ...userSafe } = user;
    expect(data).toEqual(expect.objectContaining(userSafe));
  });

  it("update password", async () => {
    const passwordUpdate = {
      password: "wsh_alors",
    };
    user.password = passwordUpdate.password;
    const { data, error } = await api.users.password.put(passwordUpdate, {
      headers: sessionHeaders,
    });
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  it("login", async () => {
    const credentials = {
      login: user.login,
      password: user.password,
    };
    const { data, error, headers } = await api.users.login.post(credentials);
    expect(error).toBeNil();
    expect(data).toBeEmpty();
    setCookies(headers);
  });

  it("logout", async () => {
    const { data, error, headers } = await api.users.logout.post(
      {},
      {
        headers: sessionHeaders,
      },
    );
    expect(error).toBeNil();
    expect(data).toBeEmpty();
    setCookies(headers);
  });

  it("get current user - unauthorized", async () => {
    const { data, error } = await api.users.get({ headers: sessionHeaders });
    expect(error).not.toBeNil();
    expect(error!.status).toBe(401);
    expect(data).toBeNil();
  });

  it("login by phone", async () => {
    const credentials = {
      login: user.phone,
      password: user.password,
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
});
