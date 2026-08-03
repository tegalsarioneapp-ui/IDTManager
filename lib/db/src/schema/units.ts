import { pgTable, serial, text, integer, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
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
  namaPembeli: text("nama_pembeli"),
  nomorPembeli: text("nomor_pembeli"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  // Bug #15: index on status — all list/filter/aggregate queries filter by status
  index("units_status_idx").on(t.status),
  // Bug #16: index on tanggal_jual — date-range queries in laporan and terjual views
  index("units_tanggal_jual_idx").on(t.tanggalJual),
]);

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
