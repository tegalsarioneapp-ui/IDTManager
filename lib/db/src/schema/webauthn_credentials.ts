import { pgTable, serial, integer, text, bigint, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const webauthnCredentialsTable = pgTable("webauthn_credentials", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(), // base64url-encoded Uint8Array
  counter: bigint("counter", { mode: "number" }).notNull().default(0),
  aaguid: text("aaguid"),
  transports: text("transports"), // JSON-encoded string[]
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WebAuthnCredential = typeof webauthnCredentialsTable.$inferSelect;
