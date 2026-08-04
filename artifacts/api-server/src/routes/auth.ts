import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, webauthnCredentialsTable } from "@workspace/db";
import bcrypt from "bcryptjs";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";

const router: IRouter = Router();

// ─── helpers ──────────────────────────────────────────────────────────────────

function safeUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    mustChangePassword: u.mustChangePassword,
  };
}

// ─── Public: check / me / users ───────────────────────────────────────────────

router.get("/auth/check", async (_req, res): Promise<void> => {
  const [user] = await db.select({ id: usersTable.id }).from(usersTable).limit(1);
  res.json({ hasUsers: !!user });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Belum login" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) { req.session.destroy(() => {}); res.status(401).json({ error: "User tidak ditemukan" }); return; }
  res.json(safeUser(user));
});

// ─── Password login ────────────────────────────────────────────────────────────

router.post("/auth/login/password", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username?.trim() || !password) { res.status(400).json({ error: "Username dan password wajib diisi" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.trim()));
  if (!user) { res.status(401).json({ error: "Username atau password salah" }); return; }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) { res.status(401).json({ error: "Username atau password salah" }); return; }

  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve()))
  );
  res.json({ ok: true, user: safeUser(user) });
});

// ─── Change password (requires session) ───────────────────────────────────────

router.post("/auth/change-password", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Belum login" }); return; }
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: "Password minimal 6 karakter" }); return;
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable)
    .set({ passwordHash: hash, mustChangePassword: false })
    .where(eq(usersTable.id, req.session.userId));
  res.json({ ok: true });
});

// ─── WebAuthn registration ─────────────────────────────────────────────────────

router.post("/auth/register/begin", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Belum login" }); return; }
  const { origin } = req.body as { origin?: string };
  if (!origin) { res.status(400).json({ error: "origin wajib diisi" }); return; }

  const rpID = new URL(origin).hostname;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) { res.status(404).json({ error: "User tidak ditemukan" }); return; }

  const existingCreds = await db.select({ credentialId: webauthnCredentialsTable.credentialId })
    .from(webauthnCredentialsTable).where(eq(webauthnCredentialsTable.userId, user.id));

  const options = await generateRegistrationOptions({
    rpName: "INDO DUTA TECH",
    rpID,
    userName: user.username,
    userDisplayName: user.displayName,
    attestationType: "none",
    excludeCredentials: existingCreds.map((c) => ({ id: c.credentialId })),
    authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
  });

  req.session.challenge = options.challenge;
  req.session.pendingRegistration = { username: user.username, displayName: user.displayName, origin };
  res.json(options);
});

router.post("/auth/register/finish", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Belum login" }); return; }
  const body = req.body as RegistrationResponseJSON;
  const { challenge, pendingRegistration } = req.session;
  if (!challenge || !pendingRegistration) { res.status(400).json({ error: "Tidak ada sesi pendaftaran aktif" }); return; }

  const { origin } = pendingRegistration;
  const rpID = new URL(origin).hostname;

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (e) {
    res.status(400).json({ error: "Verifikasi biometrik gagal: " + (e instanceof Error ? e.message : String(e)) }); return;
  }

  if (!verification.verified || !verification.registrationInfo) {
    res.status(400).json({ error: "Biometrik tidak terverifikasi" }); return;
  }

  const { credential, aaguid } = verification.registrationInfo;
  const publicKeyB64 = Buffer.from(credential.publicKey).toString("base64url");

  await db.insert(webauthnCredentialsTable).values({
    userId: req.session.userId,
    credentialId: credential.id,
    publicKey: publicKeyB64,
    counter: credential.counter,
    aaguid: aaguid ?? null,
    transports: JSON.stringify(body.response?.transports ?? []),
  }).onConflictDoUpdate({
    target: webauthnCredentialsTable.credentialId,
    set: { publicKey: publicKeyB64, counter: credential.counter },
  });

  req.session.challenge = undefined;
  req.session.pendingRegistration = undefined;
  res.json({ ok: true });
});

// ─── WebAuthn login ────────────────────────────────────────────────────────────

router.post("/auth/login/begin", async (req, res): Promise<void> => {
  const { username, origin } = req.body as { username?: string; origin?: string };
  if (!username?.trim() || !origin) { res.status(400).json({ error: "username dan origin wajib diisi" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.trim()));
  if (!user) { res.status(404).json({ error: "Pengguna tidak ditemukan" }); return; }

  const credentials = await db.select().from(webauthnCredentialsTable).where(eq(webauthnCredentialsTable.userId, user.id));
  if (!credentials.length) { res.status(400).json({ error: "Belum ada biometrik terdaftar" }); return; }

  const rpID = new URL(origin).hostname;
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((c) => ({ id: c.credentialId })),
    userVerification: "preferred",
  });

  req.session.challenge = options.challenge;
  req.session.pendingAuth = { userId: user.id, origin };
  res.json(options);
});

router.post("/auth/login/finish", async (req, res): Promise<void> => {
  const body = req.body as AuthenticationResponseJSON;
  const { challenge, pendingAuth } = req.session;
  if (!challenge || !pendingAuth) { res.status(400).json({ error: "Tidak ada sesi login aktif" }); return; }

  const { userId, origin } = pendingAuth;
  const rpID = new URL(origin).hostname;

  const [credential] = await db.select().from(webauthnCredentialsTable)
    .where(eq(webauthnCredentialsTable.credentialId, body.id));
  if (!credential || credential.userId !== userId) { res.status(404).json({ error: "Credential tidak ditemukan" }); return; }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, "base64url")),
        counter: credential.counter,
        transports: JSON.parse(credential.transports ?? "[]"),
      },
      requireUserVerification: false,
    });
  } catch (e) {
    res.status(400).json({ error: "Autentikasi biometrik gagal: " + (e instanceof Error ? e.message : String(e)) }); return;
  }

  if (!verification.verified) { res.status(400).json({ error: "Biometrik tidak terverifikasi" }); return; }

  await db.update(webauthnCredentialsTable)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(webauthnCredentialsTable.id, credential.id));

  req.session.challenge = undefined;
  req.session.pendingAuth = undefined;
  req.session.userId = userId;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  res.json({ ok: true, user: user ? safeUser(user) : null });
});

// ─── Check if user has biometrics ─────────────────────────────────────────────

router.get("/auth/has-biometric", async (req, res): Promise<void> => {
  if (!req.session.userId) { res.status(401).json({ error: "Belum login" }); return; }
  const creds = await db.select({ id: webauthnCredentialsTable.id })
    .from(webauthnCredentialsTable).where(eq(webauthnCredentialsTable.userId, req.session.userId));
  res.json({ hasBiometric: creds.length > 0 });
});

// ─── Logout ────────────────────────────────────────────────────────────────────

router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) { res.status(500).json({ error: "Logout gagal" }); return; }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

export default router;
