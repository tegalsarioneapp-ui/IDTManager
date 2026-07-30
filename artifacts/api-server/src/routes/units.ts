import { Router, type IRouter } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { db, unitsTable } from "@workspace/db";
import {
  ListUnitsQueryParams,
  CreateUnitBody,
  CreateUnitResponse,
  GetUnitParams,
  GetUnitResponse,
  UpdateUnitParams,
  UpdateUnitBody,
  UpdateUnitResponse,
  DeleteUnitParams,
  CompleteQcParams,
  CompleteQcBody,
  CompleteQcResponse,
  MarkSoldParams,
  MarkSoldBody,
  MarkSoldResponse,
  GetUnitCaptionParams,
  GetUnitCaptionResponse,
  GetDashboardResponse,
  ListUnitsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /units
router.get("/units", async (req, res): Promise<void> => {
  const parsed = ListUnitsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let query = db.select().from(unitsTable).$dynamic();
  if (parsed.data.status) {
    query = query.where(eq(unitsTable.status, parsed.data.status));
  }

  const units = await query.orderBy(desc(unitsTable.createdAt));
  res.json(ListUnitsResponse.parse(units));
});

// POST /units
router.post("/units", async (req, res): Promise<void> => {
  const parsed = CreateUnitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [unit] = await db
    .insert(unitsTable)
    .values({
      tipe: parsed.data.tipe,
      spek: parsed.data.spek,
      minus: parsed.data.minus,
      kelengkapan: parsed.data.kelengkapan,
      hargaBeli: parsed.data.hargaBeli,
      biayaQc: 0,
      status: "PROSES",
    })
    .returning();

  res.status(201).json(CreateUnitResponse.parse(unit));
});

// GET /units/:id
router.get("/units/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUnitParams.safeParse({ id: parseFloat(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [unit] = await db
    .select()
    .from(unitsTable)
    .where(eq(unitsTable.id, params.data.id));

  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.json(GetUnitResponse.parse(unit));
});

// PATCH /units/:id
router.patch("/units/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateUnitParams.safeParse({ id: parseFloat(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUnitBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof unitsTable.$inferInsert> = {};
  if (parsed.data.tipe !== undefined) updateData.tipe = parsed.data.tipe;
  if (parsed.data.spek !== undefined) updateData.spek = parsed.data.spek;
  if (parsed.data.minus !== undefined) updateData.minus = parsed.data.minus;
  if (parsed.data.kelengkapan !== undefined) updateData.kelengkapan = parsed.data.kelengkapan;
  if (parsed.data.hargaBeli !== undefined) updateData.hargaBeli = parsed.data.hargaBeli;

  const [unit] = await db
    .update(unitsTable)
    .set(updateData)
    .where(eq(unitsTable.id, params.data.id))
    .returning();

  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.json(UpdateUnitResponse.parse(unit));
});

// DELETE /units/:id
router.delete("/units/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteUnitParams.safeParse({ id: parseFloat(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [unit] = await db
    .delete(unitsTable)
    .where(eq(unitsTable.id, params.data.id))
    .returning();

  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.sendStatus(204);
});

// POST /units/:id/qc
router.post("/units/:id/qc", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CompleteQcParams.safeParse({ id: parseFloat(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CompleteQcBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [unit] = await db
    .update(unitsTable)
    .set({
      baterai: parsed.data.baterai,
      fisik: parsed.data.fisik,
      biayaQc: parsed.data.biayaQc,
      appTambahan: parsed.data.appTambahan ?? null,
      status: "READY",
    })
    .where(eq(unitsTable.id, params.data.id))
    .returning();

  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.json(CompleteQcResponse.parse(unit));
});

// POST /units/:id/jual
router.post("/units/:id/jual", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = MarkSoldParams.safeParse({ id: parseFloat(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = MarkSoldBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [unit] = await db
    .update(unitsTable)
    .set({
      hargaJual: parsed.data.hargaJual,
      status: "TERJUAL",
      tanggalJual: new Date(),
    })
    .where(eq(unitsTable.id, params.data.id))
    .returning();

  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  res.json(MarkSoldResponse.parse(unit));
});

// GET /units/:id/caption
router.get("/units/:id/caption", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUnitCaptionParams.safeParse({ id: parseFloat(raw) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [unit] = await db
    .select()
    .from(unitsTable)
    .where(eq(unitsTable.id, params.data.id));

  if (!unit) {
    res.status(404).json({ error: "Unit not found" });
    return;
  }

  const modal = unit.hargaBeli + unit.biayaQc;
  const hargaJual = unit.hargaJual ?? Math.round(modal * 1.05);
  const formatRp = (v: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(v);

  let teksApp = "Full Aplikasi (Windows, Office, Browser, Standar siap pakai!)";
  if (unit.appTambahan) teksApp += ` + ${unit.appTambahan}`;

  const caption = `\u{1F48E} PREMIUM REFURBISHED LAPTOP \u{1F48E}

\u{1F4BB} ${unit.tipe.toUpperCase()}

\u2699\uFE0F SPESIFIKASI GAHAR:
${unit.spek}
\u2714\uFE0F Storage: SSD (Super Fast Booting)
\u2714\uFE0F RAM: Standar 8GB (Lancar Multitasking)

\u2728 KONDISI & QC PASSING:
- 100% Lulus Quality Control Ketat
- Baterai: Health ${unit.baterai ?? "-"}% (Awet, aman buat lembur)
- Software: ${teksApp}
- Fisik: ${unit.fisik ?? "-"}
- Kelengkapan: ${unit.kelengkapan}

\u{1F4B0} HARGA NETT: ${formatRp(hargaJual)}

\u{1F4CD} INDO DUTA TECH
\u{1F3E0} Tegalsari Barat V No. 72, Semarang
\u23F0 Buka Setiap Hari (Diskon up to 50%)
\u{1F4F1} WA: 082213002006
\u{1F310} IG: @idtgrupsemarang`;

  res.json(GetUnitCaptionResponse.parse({ caption }));
});

// GET /dashboard
router.get("/dashboard", async (_req, res): Promise<void> => {
  const allUnits = await db.select().from(unitsTable);

  const unitsByStatus = {
    PROSES: allUnits.filter((u) => u.status === "PROSES"),
    READY: allUnits.filter((u) => u.status === "READY"),
    TERJUAL: allUnits.filter((u) => u.status === "TERJUAL"),
  };

  let totalModal = 0;
  let estimasiNilaiJual = 0;
  unitsByStatus.READY.forEach((u) => {
    const modal = u.hargaBeli + u.biayaQc;
    totalModal += modal;
    estimasiNilaiJual += Math.round(modal * 1.05);
  });
  const potensiProfit = estimasiNilaiJual - totalModal;

  let realisasiProfit = 0;
  unitsByStatus.TERJUAL.forEach((u) => {
    const modal = u.hargaBeli + u.biayaQc;
    realisasiProfit += (u.hargaJual ?? 0) - modal;
  });

  // Recent 5 units (any status)
  const recentUnits = allUnits
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const stats = {
    totalModal,
    totalUnitProses: unitsByStatus.PROSES.length,
    totalUnitReady: unitsByStatus.READY.length,
    totalUnitTerjual: unitsByStatus.TERJUAL.length,
    estimasiNilaiJual,
    potensiProfit,
    realisasiProfit,
    recentUnits,
  };

  res.json(GetDashboardResponse.parse(stats));
});

export default router;
