import { Router } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { db, usersTable, authenticatorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";
import type { Request } from "express";

const router = Router();

const RP_NAME = "INDO DUTA TECH";
const ADMIN_USERNAME = "admin";

function getRpId(req: Request): string {
  try {
    const origin =
      req.headers.origin ??
      (req.headers.referer ? new URL(req.headers.referer).origin : undefined) ??
      `http://${req.headers.host ?? "localhost"}`;
    return new URL(origin).hostname;
  } catch {
    return "localhost";
  }
}

function getOrigin(req: Request): string {
  if (req.headers.origin) return req.headers.origin;
  try {
    const rpId = getRpId(req);
    const proto = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    return `${proto}://${rpId}`;
  } catch {
    return "http://localhost";
  }
}

// GET /auth/status — public
router.get("/auth/status", async (req, res): Promise<void> => {
  const userId = req.session.userId;
  if (!userId) {
    const rows = await db.select().from(usersTable).limit(1);
    res.json({ loggedIn: false, hasRegistered: rows.length > 0 });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    req.session.destroy(() => {});
    res.json({ loggedIn: false, hasRegistered: false });
    return;
  }
  res.json({ loggedIn: true, username: user.username });
});

// POST /auth/register/start — public (first-time setup)
router.post("/auth/register/start", async (req, res): Promise<void> => {
  const rpID = getRpId(req);

  let [user] = await db.select().from(usersTable).where(eq(usersTable.username, ADMIN_USERNAME));
  if (!user) {
    [user] = await db.insert(usersTable).values({ username: ADMIN_USERNAME }).returning();
  }

  const existing = await db
    .select({ credentialId: authenticatorsTable.credentialId, transports: authenticatorsTable.transports })
    .from(authenticatorsTable)
    .where(eq(authenticatorsTable.userId, user.id));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: Buffer.from(String(user.id)),
    userName: user.username,
    userDisplayName: "Admin IDT",
    attestationType: "none",
    excludeCredentials: existing.map((a) => ({
      id: a.credentialId,
      transports: a.transports
        ? (JSON.parse(a.transports) as AuthenticatorTransportFuture[])
        : [],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  req.session.challenge = options.challenge;
  res.json(options);
});

// POST /auth/register/finish — public
router.post("/auth/register/finish", async (req, res): Promise<void> => {
  const body = req.body as RegistrationResponseJSON & { deviceName?: string };
  const challenge = req.session.challenge;

  if (!challenge) {
    res.status(400).json({ error: "Challenge tidak ditemukan. Mulai ulang pendaftaran." });
    return;
  }

  const rpID = getRpId(req);
  const origin = getOrigin(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (err) {
    logger.error({ err }, "Registration verification failed");
    res.status(400).json({ error: err instanceof Error ? err.message : "Verifikasi gagal" });
    return;
  }

  if (!verification.verified || !verification.registrationInfo) {
    res.status(400).json({ error: "Verifikasi gagal" });
    return;
  }

  const { credential } = verification.registrationInfo;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.username, ADMIN_USERNAME));
  if (!user) {
    [user] = await db.insert(usersTable).values({ username: ADMIN_USERNAME }).returning();
  }

  await db.insert(authenticatorsTable).values({
    userId: user.id,
    credentialId: credential.id,
    credentialPublicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: JSON.stringify(credential.transports ?? []),
    deviceName: body.deviceName ?? "Perangkat",
  });

  req.session.challenge = undefined;
  req.session.userId = user.id;

  res.json({ verified: true });
});

// POST /auth/login/start — public
router.post("/auth/login/start", async (req, res): Promise<void> => {
  const rpID = getRpId(req);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, ADMIN_USERNAME));
  if (!user) {
    res.status(400).json({ error: "Belum ada perangkat terdaftar." });
    return;
  }

  const existing = await db
    .select({ credentialId: authenticatorsTable.credentialId, transports: authenticatorsTable.transports })
    .from(authenticatorsTable)
    .where(eq(authenticatorsTable.userId, user.id));

  if (existing.length === 0) {
    res.status(400).json({ error: "Belum ada perangkat terdaftar." });
    return;
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: existing.map((a) => ({
      id: a.credentialId,
      transports: a.transports
        ? (JSON.parse(a.transports) as AuthenticatorTransportFuture[])
        : [],
    })),
    userVerification: "preferred",
  });

  req.session.challenge = options.challenge;
  res.json(options);
});

// POST /auth/login/finish — public
router.post("/auth/login/finish", async (req, res): Promise<void> => {
  const body = req.body as AuthenticationResponseJSON;
  const challenge = req.session.challenge;

  if (!challenge) {
    res.status(400).json({ error: "Challenge tidak ditemukan. Coba lagi." });
    return;
  }

  const rpID = getRpId(req);
  const origin = getOrigin(req);

  const [authenticator] = await db
    .select()
    .from(authenticatorsTable)
    .where(eq(authenticatorsTable.credentialId, body.id));

  if (!authenticator) {
    res.status(400).json({ error: "Perangkat tidak dikenal." });
    return;
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: authenticator.credentialId,
        publicKey: Buffer.from(authenticator.credentialPublicKey, "base64url"),
        counter: authenticator.counter,
        transports: authenticator.transports
          ? (JSON.parse(authenticator.transports) as AuthenticatorTransportFuture[])
          : [],
      },
    });
  } catch (err) {
    logger.error({ err }, "Authentication verification failed");
    res.status(400).json({ error: err instanceof Error ? err.message : "Autentikasi gagal" });
    return;
  }

  if (!verification.verified) {
    res.status(400).json({ error: "Autentikasi gagal." });
    return;
  }

  await db
    .update(authenticatorsTable)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(authenticatorsTable.id, authenticator.id));

  req.session.challenge = undefined;
  req.session.userId = authenticator.userId;

  res.json({ verified: true });
});

// POST /auth/logout — requires session
router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout gagal" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

// GET /auth/devices — requires auth
router.get("/auth/devices", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Tidak terautentikasi" });
    return;
  }
  const devices = await db
    .select({
      id: authenticatorsTable.id,
      deviceName: authenticatorsTable.deviceName,
      createdAt: authenticatorsTable.createdAt,
    })
    .from(authenticatorsTable)
    .where(eq(authenticatorsTable.userId, req.session.userId));

  res.json(devices);
});

// POST /auth/devices — tambah perangkat baru (saat sudah login)
router.post("/auth/devices/start", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Tidak terautentikasi" });
    return;
  }
  // Reuse register/start logic for adding a new device
  const rpID = getRpId(req);
  const userId = req.session.userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(400).json({ error: "User tidak ditemukan" });
    return;
  }

  const existing = await db
    .select({ credentialId: authenticatorsTable.credentialId, transports: authenticatorsTable.transports })
    .from(authenticatorsTable)
    .where(eq(authenticatorsTable.userId, userId));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: Buffer.from(String(user.id)),
    userName: user.username,
    userDisplayName: "Admin IDT",
    attestationType: "none",
    excludeCredentials: existing.map((a) => ({
      id: a.credentialId,
      transports: a.transports ? (JSON.parse(a.transports) as AuthenticatorTransportFuture[]) : [],
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  req.session.challenge = options.challenge;
  res.json(options);
});

router.post("/auth/devices/finish", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Tidak terautentikasi" });
    return;
  }
  const body = req.body as RegistrationResponseJSON & { deviceName?: string };
  const challenge = req.session.challenge;

  if (!challenge) {
    res.status(400).json({ error: "Challenge tidak ditemukan." });
    return;
  }

  const rpID = getRpId(req);
  const origin = getOrigin(req);

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Verifikasi gagal" });
    return;
  }

  if (!verification.verified || !verification.registrationInfo) {
    res.status(400).json({ error: "Verifikasi gagal" });
    return;
  }

  const { credential } = verification.registrationInfo;

  await db.insert(authenticatorsTable).values({
    userId: req.session.userId,
    credentialId: credential.id,
    credentialPublicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    transports: JSON.stringify(credential.transports ?? []),
    deviceName: body.deviceName ?? "Perangkat Baru",
  });

  req.session.challenge = undefined;
  res.json({ verified: true });
});

// DELETE /auth/devices/:id — requires auth
router.delete("/auth/devices/:id", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Tidak terautentikasi" });
    return;
  }

  const deviceId = Number(req.params["id"]);
  if (!Number.isFinite(deviceId)) {
    res.status(400).json({ error: "ID tidak valid" });
    return;
  }

  const [device] = await db
    .select()
    .from(authenticatorsTable)
    .where(eq(authenticatorsTable.id, deviceId));

  if (!device || device.userId !== req.session.userId) {
    res.status(404).json({ error: "Perangkat tidak ditemukan." });
    return;
  }

  const allDevices = await db
    .select({ id: authenticatorsTable.id })
    .from(authenticatorsTable)
    .where(eq(authenticatorsTable.userId, req.session.userId));

  if (allDevices.length <= 1) {
    res
      .status(400)
      .json({ error: "Tidak bisa menghapus perangkat terakhir. Daftarkan perangkat lain dulu." });
    return;
  }

  await db.delete(authenticatorsTable).where(eq(authenticatorsTable.id, deviceId));
  res.json({ success: true });
});

export default router;
