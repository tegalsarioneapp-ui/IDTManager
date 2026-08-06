import { pgEnum, pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { unitsTable } from "./units";
import { sparepartsTable } from "./spareparts";

export const qcChecklistCategoryEnum = pgEnum("qc_checklist_category", [
  "PHYSICAL",
  "DISPLAY",
  "HARDWARE_IO",
  "PERFORMANCE_SOFTWARE",
]);

export const qcChecklistStatusEnum = pgEnum("qc_checklist_status", ["PASS", "FAIL", "N/A"]);

export const qcChecklistResultsTable = pgTable(
  "qc_checklist_results",
  {
    id: serial("id").primaryKey(),
    unitId: integer("unit_id")
      .notNull()
      .references(() => unitsTable.id, { onDelete: "cascade" }),
    category: qcChecklistCategoryEnum("category").notNull(),
    itemKey: text("item_key").notNull(),
    itemLabel: text("item_label").notNull(),
    status: qcChecklistStatusEnum("status").notNull(),
    notes: text("notes"),
    sparepartId: integer("sparepart_id").references(() => sparepartsTable.id, {
      onDelete: "set null",
    }),
    sparepartUnitCost: integer("sparepart_unit_cost"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("qc_checklist_unit_id_idx").on(t.unitId),
    index("qc_checklist_category_idx").on(t.category),
    index("qc_checklist_status_idx").on(t.status),
    index("qc_checklist_sparepart_id_idx").on(t.sparepartId),
  ],
);
