import { treaty } from "@elysiajs/eden";
import { app } from "../src/index";
import { studentOffice } from "../src/schema";
import { studentOffice as studentOfficeTable } from "../src/schema";
import { eq } from "drizzle-orm";
import { Value } from "@sinclair/typebox/value";

// Can be used in tests to register a new user, login
// and get the corresponding session headers.
// The returned function must be called at the end of
// the test to clean up the created user.
export async function newUserSession(): Promise<
  [Record<string, string>, () => void]
> {
  const api = treaty(app);

  let user: any = {
    login: "testuser",
    password: "test_pass",
    email: "testos@mail.com",
    fullName: "John Tester",
    phone: "+33606060606",
  };
  await api.users.register.post(user);

  const credentials = {
    login: user.login,
    password: user.password,
  };
  const { headers } = await api.users.login.post(credentials);

  const sessionHeaders = { cookie: new Headers(headers).get("set-cookie")! };
  const removeUser = async () => {
    await api.users.delete({}, { headers: sessionHeaders });
  };

  return [sessionHeaders, removeUser];
}

export async function newStudentOfficeWithUserSession(): Promise<
  [Record<string, string>, () => void]
> {
  const [sessionHeaders1, removeUser] = await newUserSession();

  const api = treaty(app);

  let req: any = {
    user: {
      login: "testadmin",
      password: "test_pass",
      email: "admin@mail.com",
    },
    studentOffice: {
      schoolName: "Test School",
      domain: "test-school.com",
    },
  };
  await api["student-offices"].post(req, {
    headers: sessionHeaders1,
  });
  await removeUser();

  const credentials = {
    login: req.user.login,
    password: req.user.password,
  };
  const { headers } = await api.users.login.post(credentials);

  const sessionHeaders = { cookie: new Headers(headers).get("set-cookie")! };

  const removeStudentOfficeAndUser = async () => {
    const { data, error } = await api["student-offices"].get({
      headers: sessionHeaders,
      query: {},
    });
    await api.users.delete({}, { headers: sessionHeaders });
    await app.decorator.db
      .delete(studentOfficeTable)
      .where(eq(studentOfficeTable.id, (data as any).id));
  };
  return [sessionHeaders, removeStudentOfficeAndUser];
}
