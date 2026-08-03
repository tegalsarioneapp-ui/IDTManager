import { Router, type IRouter } from "express";
import { eq, and, desc, count, sum, sql } from "drizzle-orm";
import { db, unitsTable, storeSettingsTable } from "@workspace/db";
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
  GetUnitInvoiceParams,
  GetUnitInvoiceResponse,
  GetUnitKuitansiParams,
  GetUnitKuitansiResponse,
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
    .where(and(eq(unitsTable.id, params.data.id), eq(unitsTable.status, "PROSES")))
    .returning();

  if (!unit) {
    res.status(404).json({ error: "Unit tidak ditemukan atau statusnya bukan PROSES" });
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
      namaPembeli: parsed.data.namaPembeli,
      nomorPembeli: parsed.data.nomorPembeli,
      status: "TERJUAL",
      tanggalJual: new Date(),
    })
    .where(and(eq(unitsTable.id, params.data.id), eq(unitsTable.status, "READY")))
    .returning();

  if (!unit) {
    res.status(404).json({ error: "Unit tidak ditemukan atau statusnya bukan READY" });
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

  const [[unit], [store]] = await Promise.all([
    db.select().from(unitsTable).where(eq(unitsTable.id, params.data.id)),
    db.select().from(storeSettingsTable).where(eq(storeSettingsTable.id, 1)),
  ]);

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

  const namaToko = store?.namaToko || "INDO DUTA TECH";
  const alamat = store?.alamat ? `\u{1F3E0} ${store.alamat}` : "";
  const waLine = store?.whatsapp ? `\u{1F4F1} WA: ${store.whatsapp}` : "";
  const igLine = store?.instagram ? `\u{1F310} IG: ${store.instagram}` : "";
  const kontakLines = [alamat, waLine, igLine].filter(Boolean).join("\n");

  const caption = `\u{1F48E} PREMIUM REFURBISHED LAPTOP \u{1F48E}

\u{1F4BB} ${unit.tipe.toUpperCase()}

\u2699\uFE0F SPESIFIKASI:
${unit.spek}

\u2728 KONDISI & QC PASSING:
- 100% Lulus Quality Control Ketat
- Baterai: Health ${unit.baterai ?? "-"}% (Awet, aman buat lembur)
- Software: ${teksApp}
- Fisik: ${unit.fisik ?? "-"}
- Kelengkapan: ${unit.kelengkapan}

\u{1F4B0} HARGA NETT: ${formatRp(hargaJual)}

\u{1F4CD} ${namaToko}
${kontakLines}`.trimEnd();

  res.json(GetUnitCaptionResponse.parse({ caption }));
});

// Helper: Indonesian number-to-words
function terbilang(n: number): string {
  const satuan = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan",
    "sepuluh", "sebelas", "dua belas", "tiga belas", "empat belas", "lima belas", "enam belas",
    "tujuh belas", "delapan belas", "sembilan belas"];
  const puluhan = ["", "", "dua puluh", "tiga puluh", "empat puluh", "lima puluh",
    "enam puluh", "tujuh puluh", "delapan puluh", "sembilan puluh"];
  if (n < 20) return satuan[n];
  if (n < 100) return puluhan[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + satuan[n % 10] : "");
  if (n < 200) return "seratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "");
  if (n < 1000) return satuan[Math.floor(n / 100)] + " ratus" + (n % 100 !== 0 ? " " + terbilang(n % 100) : "");
  if (n < 2000) return "seribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "");
  if (n < 1_000_000) return terbilang(Math.floor(n / 1000)) + " ribu" + (n % 1000 !== 0 ? " " + terbilang(n % 1000) : "");
  if (n < 1_000_000_000) return terbilang(Math.floor(n / 1_000_000)) + " juta" + (n % 1_000_000 !== 0 ? " " + terbilang(n % 1_000_000) : "");
  return terbilang(Math.floor(n / 1_000_000_000)) + " miliar" + (n % 1_000_000_000 !== 0 ? " " + terbilang(n % 1_000_000_000) : "");
}

async function getOrCreateSettings() {
  const [s] = await db.select().from(storeSettingsTable).where(eq(storeSettingsTable.id, 1));
  if (s) return s;
  const [created] = await db.insert(storeSettingsTable).values({
    namaToko: "INDO DUTA TECH", tagline: "Premium Reseller",
    alamat: "", telepon: "", email: "", instagram: "", facebook: "",
    whatsapp: "", tiktok: "", website: "", logo: "",
  }).returning();
  return created;
}

// GET /units/:id/invoice
router.get("/units/:id/invoice", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUnitInvoiceParams.safeParse({ id: parseFloat(raw) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, params.data.id));
  if (!unit) { res.status(404).json({ error: "Unit not found" }); return; }

  const store = await getOrCreateSettings();
  const tanggal = unit.tanggalJual ?? unit.createdAt;
  const pad = (v: number) => String(v).padStart(3, "0");
  const nomorInvoice = `INV/${tanggal.getFullYear()}/${String(tanggal.getMonth() + 1).padStart(2, "0")}/${pad(unit.id)}`;

  res.json(GetUnitInvoiceResponse.parse({
    nomorInvoice,
    tanggal: tanggal.toISOString(),
    unit,
    store,
    subtotal: unit.hargaJual ?? 0,
    total: unit.hargaJual ?? 0,
  }));
});

// GET /units/:id/kuitansi
router.get("/units/:id/kuitansi", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUnitKuitansiParams.safeParse({ id: parseFloat(raw) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [unit] = await db.select().from(unitsTable).where(eq(unitsTable.id, params.data.id));
  if (!unit) { res.status(404).json({ error: "Unit not found" }); return; }

  const store = await getOrCreateSettings();
  const tanggal = unit.tanggalJual ?? unit.createdAt;
  const pad = (v: number) => String(v).padStart(3, "0");
  const nomorKuitansi = `KWT/${tanggal.getFullYear()}/${String(tanggal.getMonth() + 1).padStart(2, "0")}/${pad(unit.id)}`;
  const jumlah = unit.hargaJual ?? 0;

  res.json(GetUnitKuitansiResponse.parse({
    nomorKuitansi,
    tanggal: tanggal.toISOString(),
    unit,
    store,
    jumlah,
    terbilang: terbilang(jumlah) + " rupiah",
  }));
});

// GET /dashboard — uses SQL aggregates, no full-table scan
router.get("/dashboard", async (_req, res): Promise<void> => {
  // Run all queries in parallel
  const [prosesAgg, readyAgg, terjualAgg, recentUnits] = await Promise.all([
    db
      .select({ total: count() })
      .from(unitsTable)
      .where(eq(unitsTable.status, "PROSES")),

    db
      .select({
        total: count(),
        totalModal: sum(sql<number>`${unitsTable.hargaBeli} + ${unitsTable.biayaQc}`),
        estimasiNilaiJual: sum(sql<number>`ROUND((${unitsTable.hargaBeli} + ${unitsTable.biayaQc}) * 1.05)`),
      })
      .from(unitsTable)
      .where(eq(unitsTable.status, "READY")),

    db
      .select({
        total: count(),
        realisasiProfit: sum(
          sql<number>`COALESCE(${unitsTable.hargaJual}, 0) - ${unitsTable.hargaBeli} - ${unitsTable.biayaQc}`
        ),
      })
      .from(unitsTable)
      .where(eq(unitsTable.status, "TERJUAL")),

    db
      .select()
      .from(unitsTable)
      .orderBy(desc(unitsTable.createdAt))
      .limit(5),
  ]);

  const totalModal = Number(readyAgg[0]?.totalModal ?? 0);
  const estimasiNilaiJual = Number(readyAgg[0]?.estimasiNilaiJual ?? 0);

  const stats = {
    totalModal,
    totalUnitProses: prosesAgg[0]?.total ?? 0,
    totalUnitReady: readyAgg[0]?.total ?? 0,
    totalUnitTerjual: terjualAgg[0]?.total ?? 0,
    estimasiNilaiJual,
    potensiProfit: estimasiNilaiJual - totalModal,
    realisasiProfit: Number(terjualAgg[0]?.realisasiProfit ?? 0),
    recentUnits,
  };

  res.json(GetDashboardResponse.parse(stats));
});

export default router;
