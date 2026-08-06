import { Router, type IRouter } from "express";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db, qcUsageTable, sparepartsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const createSparepartSchema = z.object({
  jenisBarang: z.string().min(1, "Jenis Barang wajib diisi"),
  hargaBeli: z.coerce.number().min(0, "Harga Beli tidak valid"),
  stock: z.coerce.number().int().min(1, "Stock minimal 1").optional(),
  tanggal: z.string().optional(),
});

const createQcUsageSchema = z.object({
  sparepartId: z.coerce.number().int().positive(),
  hargaPenggantian: z.coerce.number().min(0, "Harga Penggantian tidak valid"),
  catatan: z.string().optional(),
  tanggalPenggantian: z.string().optional(),
});

const sparepartResponseSchema = z.object({
  id: z.number(),
  sku: z.string(),
  jenisBarang: z.string(),
  hargaBeli: z.number(),
  stock: z.number(),
  tanggal: z.string(),
  createdAt: z.string(),
});

const qcUsageResponseSchema = z.object({
  id: z.number(),
  sparepartId: z.number(),
  hargaPenggantian: z.number(),
  tanggalPenggantian: z.string(),
  catatan: z.string().nullable(),
  createdAt: z.string(),
});

const listSparepartsQuerySchema = z.object({
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

function formatDateForSku(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

async function generateSku(date: Date) {
  const skuDate = formatDateForSku(date);
  const baseSku = `SP-${skuDate}-`;

  const spareparts = await db
    .select({ sku: sparepartsTable.sku })
    .from(sparepartsTable)
    .where(sql`sku LIKE ${baseSku + "%"}`);

  const highest = spareparts
    .map((item) => {
      const match = item.sku.match(/-(\d{4})$/);
      return match ? Number(match[1]) : 0;
    })
    .sort((a, b) => b - a)[0] ?? 0;

  return `${baseSku}${String(highest + 1).padStart(4, "0")}`;
}

// GET /spareparts
router.get("/spareparts", async (req, res): Promise<void> => {
  const parsed = listSparepartsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { limit = 50, offset = 0 } = parsed.data;

  const items = await db
    .select()
    .from(sparepartsTable)
    .orderBy(desc(sparepartsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(items.map((item) => ({
    ...item,
    tanggal: item.tanggal.toISOString(),
    createdAt: item.createdAt.toISOString(),
  })));
});

// POST /spareparts
router.post("/spareparts", async (req, res): Promise<void> => {
  const parsed = createSparepartSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tanggal = parsed.data.tanggal ? new Date(parsed.data.tanggal) : new Date();
  const sku = await generateSku(tanggal);

  const [created] = await db
    .insert(sparepartsTable)
    .values({
      sku,
      jenisBarang: parsed.data.jenisBarang,
      hargaBeli: parsed.data.hargaBeli,
      stock: parsed.data.stock ?? 1,
      tanggal,
    })
    .returning();

  res.status(201).json(sparepartResponseSchema.parse({
    ...created,
    tanggal: created.tanggal.toISOString(),
    createdAt: created.createdAt.toISOString(),
  }));
});

// POST /spareparts/qc
router.post("/spareparts/qc", async (req, res): Promise<void> => {
  const parsed = createQcUsageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const tanggalPenggantian = parsed.data.tanggalPenggantian
    ? new Date(parsed.data.tanggalPenggantian)
    : new Date();

  let created: typeof qcUsageTable.$inferSelect | undefined;

  try {
    created = await db.transaction(async (tx) => {
      const [sparepart] = await tx
        .select()
        .from(sparepartsTable)
        .where(and(eq(sparepartsTable.id, parsed.data.sparepartId), gt(sparepartsTable.stock, 0)));

      if (!sparepart) {
        throw new Error("Sparepart tidak ditemukan atau stock habis");
      }

      await tx
        .update(sparepartsTable)
        .set({ stock: sql`${sparepartsTable.stock} - 1` })
        .where(eq(sparepartsTable.id, parsed.data.sparepartId));

      const [inserted] = await tx
        .insert(qcUsageTable)
        .values({
          sparepartId: parsed.data.sparepartId,
          hargaPenggantian: parsed.data.hargaPenggantian,
          tanggalPenggantian,
          catatan: parsed.data.catatan ?? null,
        })
        .returning();

      return inserted;
    });
  } catch (error) {
    const message = (error as Error).message;
    res.status(message.includes("stock habis") ? 400 : 404).json({ error: message });
    return;
  }

  res.status(201).json(qcUsageResponseSchema.parse({
    ...created,
    tanggalPenggantian: created.tanggalPenggantian.toISOString(),
    catatan: created.catatan,
    createdAt: created.createdAt.toISOString(),
  }));
});

export default router;
