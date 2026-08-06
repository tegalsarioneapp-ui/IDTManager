import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, qcUsageTable, sparepartsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const createSparepartSchema = z.object({
  jenisBarang: z.string().min(1, "Jenis Barang wajib diisi"),
  hargaBeli: z.coerce.number().min(0, "Harga Beli tidak valid"),
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

  const [sparepart] = await db
    .select()
    .from(sparepartsTable)
    .where(eq(sparepartsTable.id, parsed.data.sparepartId));

  if (!sparepart) {
    res.status(404).json({ error: "Sparepart tidak ditemukan" });
    return;
  }

  const tanggalPenggantian = parsed.data.tanggalPenggantian
    ? new Date(parsed.data.tanggalPenggantian)
    : new Date();

  const [created] = await db
    .insert(qcUsageTable)
    .values({
      sparepartId: parsed.data.sparepartId,
      hargaPenggantian: parsed.data.hargaPenggantian,
      tanggalPenggantian,
      catatan: parsed.data.catatan ?? null,
    })
    .returning();

  res.status(201).json(qcUsageResponseSchema.parse({
    ...created,
    tanggalPenggantian: created.tanggalPenggantian.toISOString(),
    catatan: created.catatan,
    createdAt: created.createdAt.toISOString(),
  }));
});

export default router;
