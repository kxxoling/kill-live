import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const messageTypeEnum = pgEnum("message_type", ["text", "image", "file", "system"]);
export const participantRoleEnum = pgEnum("participant_role", ["owner", "admin", "member"]);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isAnonymous: boolean("is_anonymous").default(true),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  password: text("password"),
  createdBy: text("created_by").references(() => users.id),
  ownerId: text("owner_id").references(() => users.id),
  config: jsonb("config").$type<{
    maxParticipants?: number;
    enableChat?: boolean;
    enableVideo?: boolean;
    enableAudio?: boolean;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  type: messageTypeEnum("type").default("text"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: integer("file_size"),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  roomId: text("room_id")
    .references(() => rooms.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomParticipants = pgTable("room_participants", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id)
    .notNull(),
  roomId: text("room_id")
    .references(() => rooms.id)
    .notNull(),
  role: participantRoleEnum("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  rooms: many(rooms),
  participations: many(roomParticipants),
}));

export const roomsRelations = relations(rooms, ({ many, one }) => ({
  messages: many(messages),
  participants: many(roomParticipants),
  creator: one(users, {
    fields: [rooms.createdBy],
    references: [users.id],
  }),
  owner: one(users, {
    fields: [rooms.ownerId],
    references: [users.id],
    relationName: "roomOwner",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
}));

export const roomParticipantsRelations = relations(roomParticipants, ({ one }) => ({
  user: one(users, {
    fields: [roomParticipants.userId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [roomParticipants.roomId],
    references: [rooms.id],
  }),
}));
