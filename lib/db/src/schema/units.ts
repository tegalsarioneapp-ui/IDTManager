import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const unitStatusEnum = pgEnum("unit_status", ["PROSES", "READY", "TERJUAL"]);

export const unitsTable = pgTable("units", {
  id: serial("id").primaryKey(),
  tipe: text("tipe").notNull(),
  spek: text("spek").notNull(),
  minus: text("minus").notNull(),
  kelengkapan: text("kelengkapan").notNull(),
  hargaBeli: integer("harga_beli").notNull(),
  biayaQc: integer("biaya_qc").notNull().default(0),
  baterai: integer("baterai"),
  appTambahan: text("app_tambahan"),
  fisik: text("fisik"),
  status: unitStatusEnum("status").notNull().default("PROSES"),
  hargaJual: integer("harga_jual"),
  tanggalJual: timestamp("tanggal_jual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUnitSchema = createInsertSchema(unitsTable).omit({
  id: true,
  createdAt: true,
  status: true,
  biayaQc: true,
  baterai: true,
  appTambahan: true,
  fisik: true,
  hargaJual: true,
  tanggalJual: true,
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof unitsTable.$inferSelect;
