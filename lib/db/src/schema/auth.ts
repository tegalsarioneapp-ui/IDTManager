import { pgTable, serial, text, timestamp, integer, bigint } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;

export const authenticatorsTable = pgTable("authenticators", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(), // base64url
  credentialPublicKey: text("credential_public_key").notNull(), // base64url-encoded Uint8Array
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  transports: text("transports"), // JSON-stringified AuthenticatorTransportFuture[]
  deviceName: text("device_name").notNull().default("Perangkat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Authenticator = typeof authenticatorsTable.$inferSelect;
