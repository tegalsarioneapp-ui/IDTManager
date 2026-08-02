import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeSettingsTable = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  namaToko: text("nama_toko").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  alamat: text("alamat").notNull().default(""),
  telepon: text("telepon").notNull().default(""),
  email: text("email").notNull().default(""),
  instagram: text("instagram").notNull().default(""),
  facebook: text("facebook").notNull().default(""),
  whatsapp: text("whatsapp").notNull().default(""),
  tiktok: text("tiktok").notNull().default(""),
  website: text("website").notNull().default(""),
  logo: text("logo").notNull().default(""), // base64 data URL
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStoreSettingsSchema = createInsertSchema(storeSettingsTable).omit({
  id: true,
  updatedAt: true,
});

export const selectStoreSettingsSchema = createSelectSchema(storeSettingsTable);

export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type StoreSettings = typeof storeSettingsTable.$inferSelect;
