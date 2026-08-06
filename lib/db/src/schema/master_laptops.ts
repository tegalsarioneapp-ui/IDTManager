import { index, pgTable, serial, text } from "drizzle-orm/pg-core";

export const masterLaptopsTable = pgTable(
  "master_laptops",
  {
    id: serial("id").primaryKey(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    defaultCpu: text("default_cpu").notNull(),
    defaultRam: text("default_ram").notNull(),
    defaultStorage: text("default_storage").notNull(),
    defaultGpu: text("default_gpu").notNull(),
    defaultDisplay: text("default_display").notNull(),
  },
  (t) => [
    index("master_laptops_brand_idx").on(t.brand),
    index("master_laptops_model_idx").on(t.model),
  ],
);

export type MasterLaptop = typeof masterLaptopsTable.$inferSelect;