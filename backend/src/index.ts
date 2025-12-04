import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { userController } from "./service/user";
import { menuItemController } from "./service/menu-item";
import { initFormats } from "./utils/formats";
import { studentOfficeController } from "./service/student-office";
import { postController } from "./service/post";
import { voteController } from "./service/vote";
import { error } from "./error";

initFormats();

export const app = new Elysia()
  .use(error())
  .use(swagger())
  .use(studentOfficeController())
  .use(userController())
  .use(menuItemController())
  .use(postController())
  .use(voteController())
  .get("/", () => "Hello World")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
