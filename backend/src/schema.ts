import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { cuid2 } from "drizzle-cuid2/postgres";
import { currencies } from "./types/currency";
import { role } from "./types/role";

export const currency = pgEnum("currency", currencies);

export const userRole = pgEnum("user_role", role);

export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  login: text("login").notNull().unique(),
  email: text("email").notNull().unique(),
  schoolEmail: text("school_email").unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  phone: text("phone").unique(),
  verified: boolean("verified").notNull().default(false),
  profilePictureUrl: text("profile_picture_url"),
  role: userRole("role").notNull().default("student"),
  studentOfficeId: integer("student_office_id").references(
    () => studentOffice.id,
  ),
});

export const session = pgTable("session", {
  id: cuid2("id").primaryKey(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    precision: 3,
  }).notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const studentOffice = pgTable("student_office", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull(),
  description: text("description"),
  profilePictureUrl: text("profile_picture_url"),
  coverPictureUrl: text("cover_picture_url"),
  domain: text("domain").notNull(),
});

export const event = pgTable("event", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  pictureUrl: text("picture_url").notNull(),
  startDate: timestamp("start_date", {
    withTimezone: true,
    precision: 3,
  }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true, precision: 3 }),
  address: text("address"),
  draft: boolean("draft").notNull().default(false),
  studentOfficeId: integer("student_office_id")
    .notNull()
    .references(() => studentOffice.id),
});

export const likedEvent = pgTable(
  "liked_event",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => user.id),
    eventId: integer("event_id")
      .notNull()
      .references(() => event.id),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.eventId] }),
  }),
);

export const ticketOption = pgTable("ticket_option", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  currency: currency("currency").notNull(),
  price: text("price").notNull(),
  stock: integer("total_quantity"),
  eventId: integer("event_id")
    .notNull()
    .references(() => event.id),
});

export const ticket = pgTable("ticket", {
  uid: cuid2("uid").primaryKey().defaultRandom(),
  userId: integer("user_id")
    .notNull()
    .references(() => user.id),
  ticketOptionId: integer("ticket_option_id")
    .notNull()
    .references(() => ticketOption.id),
  used: boolean("used").notNull().default(false),
});

export const menuItem = pgTable("menu_item", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  currency: currency("currency").notNull(),
  price: text("price").notNull(),
  pictureUrl: text("picture_url"),
  studentOfficeId: integer("student_office_id")
    .notNull()
    .references(() => studentOffice.id),
});

export const post = pgTable("post", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdOn: timestamp("created_on", { withTimezone: true, precision: 3 })
    .notNull()
    .default(sql`now()`),
  updatedOn: timestamp("updated_on", { withTimezone: true, precision: 3 }),
  studentOfficeId: integer("student_office_id")
    .notNull()
    .references(() => studentOffice.id),
  pollOptions: text("poll_options").array(),
});

export const vote = pgTable(
  "vote",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => user.id),
    postId: integer("post_id")
      .notNull()
      .references(() => post.id),
    optionIndex: integer("option_index").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.postId] }),
  }),
);

export const postRelations = relations(post, ({ many }) => ({
  votes: many(vote),
}));

export const voteRelations = relations(vote, ({ one }) => ({
  posts: one(post, {
    fields: [vote.postId],
    references: [post.id],
  }),
}));
