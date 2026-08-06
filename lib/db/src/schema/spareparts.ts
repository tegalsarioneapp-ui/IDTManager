import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sparepartsTable = pgTable(
  "spareparts",
  {
    id: serial("id").primaryKey(),
    sku: text("sku").notNull().unique(),
    jenisBarang: text("jenis_barang").notNull(),
    hargaBeli: integer("harga_beli").notNull(),
    stock: integer("stock").notNull().default(1),
    tanggal: timestamp("tanggal").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("spareparts_sku_idx").on(t.sku),
    index("spareparts_jenis_barang_idx").on(t.jenisBarang),
    index("spareparts_tanggal_idx").on(t.tanggal),
  ],
);

export const qcUsageTable = pgTable(
  "qc_usage",
  {
    id: serial("id").primaryKey(),
    sparepartId: integer("sparepart_id").notNull().references(() => sparepartsTable.id),
    hargaPenggantian: integer("harga_penggantian").notNull(),
    tanggalPenggantian: timestamp("tanggal_penggantian").notNull().defaultNow(),
    catatan: text("catatan"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("qc_usage_sparepart_id_idx").on(t.sparepartId),
    index("qc_usage_tanggal_penggantian_idx").on(t.tanggalPenggantian),
  ],
);

export const insertSparepartSchema = createInsertSchema(sparepartsTable).omit({
  id: true,
  createdAt: true,
  sku: true,
});

export const selectSparepartSchema = createSelectSchema(sparepartsTable);

export const insertQcUsageSchema = createInsertSchema(qcUsageTable).omit({
  id: true,
  createdAt: true,
});

export const selectQcUsageSchema = createSelectSchema(qcUsageTable);

export type InsertSparepart = z.infer<typeof insertSparepartSchema>;
export type Sparepart = typeof sparepartsTable.$inferSelect;

export type InsertQcUsage = z.infer<typeof insertQcUsageSchema>;
export type QcUsage = typeof qcUsageTable.$inferSelect;
