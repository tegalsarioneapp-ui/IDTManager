import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, storeSettingsTable } from "@workspace/db";
import {
  GetSettingsResponse,
  UpdateSettingsBody,
  UpdateSettingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Ensure a settings row always exists (id=1)
async function ensureSettings() {
  const [existing] = await db
    .select()
    .from(storeSettingsTable)
    .where(eq(storeSettingsTable.id, 1));

  if (!existing) {
    const [created] = await db
      .insert(storeSettingsTable)
      .values({
        namaToko: "INDO DUTA TECH",
        tagline: "Premium Reseller",
        alamat: "",
        telepon: "",
        email: "",
        instagram: "",
        facebook: "",
        whatsapp: "",
        tiktok: "",
        website: "",
        logo: "",
      })
      .returning();
    return created;
  }
  return existing;
}

// GET /settings
router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(GetSettingsResponse.parse(settings));
});

// PUT /settings
router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await ensureSettings();

  const updateData: Partial<typeof storeSettingsTable.$inferInsert> = {};
  const d = parsed.data;
  if (d.namaToko !== undefined) updateData.namaToko = d.namaToko;
  if (d.tagline !== undefined) updateData.tagline = d.tagline;
  if (d.alamat !== undefined) updateData.alamat = d.alamat;
  if (d.telepon !== undefined) updateData.telepon = d.telepon;
  if (d.email !== undefined) updateData.email = d.email;
  if (d.instagram !== undefined) updateData.instagram = d.instagram;
  if (d.facebook !== undefined) updateData.facebook = d.facebook;
  if (d.whatsapp !== undefined) updateData.whatsapp = d.whatsapp;
  if (d.tiktok !== undefined) updateData.tiktok = d.tiktok;
  if (d.website !== undefined) updateData.website = d.website;
  if (d.logo !== undefined) updateData.logo = d.logo;
  updateData.updatedAt = new Date();

  const [updated] = await db
    .update(storeSettingsTable)
    .set(updateData)
    .where(eq(storeSettingsTable.id, 1))
    .returning();

  res.json(UpdateSettingsResponse.parse(updated));
});

export default router;
