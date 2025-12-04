import { afterAll, describe, expect, it } from "bun:test";
import { treaty } from "@elysiajs/eden";
import { app } from "../src/index";
import { newStudentOfficeWithUserSession } from "./auth-utils";

const api = treaty(app);
const [sessionHeaders, cleanDb] = await newStudentOfficeWithUserSession();

describe("Elysia", () => {
  afterAll(cleanDb);

  let menuItems: any[] = [
    {
      name: "Pizza",
      currency: "EUR",
      price: "123",
      pictureUrl: "https://example.com/pizza.jpg",
    },
    { name: "Burger", currency: "USD", price: "456" },
  ];

  const checkMenuItems = (name: string) =>
    it(name, async () => {
      const { data, error } = await api["menu-items"].get({
        headers: sessionHeaders,
      });
      expect(error).toBeNil();
      expect(data).not.toBeNil();
      expect(data).toHaveLength(menuItems.length);
      for (let i = 0; i > data!.length; i++) {
        expect(data![i]).toEqual(expect.objectContaining(menuItems[i]));
      }
      menuItems = data!;
    });

  for (const menuItem of menuItems) {
    it("create a menu item", async () => {
      const { data, error } = await api["menu-items"].post(menuItem, {
        headers: sessionHeaders,
      });
      expect(error).toBeNil();
      expect(data).toBeEmpty();
    });
  }

  checkMenuItems("get menu items");

  it("update a menu item", async () => {
    menuItems[0].price = "1";
    let { id, studentOfficeId, ...newMenuItem } = menuItems[0];
    const { data, error } = await api["menu-items"]({
      id: id,
    }).put(newMenuItem, { headers: sessionHeaders });
    expect(error).toBeNil();
    expect(data).toBeEmpty();
  });

  checkMenuItems("get updated menu items");

  for (let i = 0; i < menuItems.length; i++) {
    it("delete a menu item", async () => {
      const { data, error } = await api["menu-items"]({
        id: menuItems[i].id,
      }).delete({}, { headers: sessionHeaders });
      expect(error).toBeNil();
      expect(data).toBeEmpty();
      if (i === menuItems.length - 1) {
        menuItems = [];
      }
    });
  }

  checkMenuItems("get no menu items");
});
