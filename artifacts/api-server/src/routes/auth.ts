import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, webauthnCredentialsTable } from "@workspace/db";
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

// GET /auth/check — is anyone registered yet?
router.get("/auth/check", async (_req, res): Promise<void> => {
  const [user] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .limit(1);
  res.json({ hasUsers: !!user });
});

// GET /auth/users — list of registered usernames (for login UI)
router.get("/auth/users", async (_req, res): Promise<void> => {
  const users = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(users);
});

// GET /auth/me — current session user
router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Belum login" });
    return;
  }
  const [user] = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName })
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User tidak ditemukan" });
    return;
  }
  res.json(user);
});

// POST /auth/register/begin
router.post("/auth/register/begin", async (req, res): Promise<void> => {
  const { username, displayName, origin } = req.body as {
    username?: string;
    displayName?: string;
    origin?: string;
  };
  if (!username?.trim() || !displayName?.trim() || !origin) {
    res.status(400).json({ error: "username, displayName, dan origin wajib diisi" });
    return;
  }

  const rpID = new URL(origin).hostname;

  // Exclude credentials already registered for this username
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.trim()));

  const existingCreds = existing
    ? await db
        .select({ credentialId: webauthnCredentialsTable.credentialId })
        .from(webauthnCredentialsTable)
        .where(eq(webauthnCredentialsTable.userId, existing.id))
    : [];

  const options = await generateRegistrationOptions({
    rpName: "INDO DUTA TECH",
    rpID,
    userName: username.trim(),
    userDisplayName: displayName.trim(),
    attestationType: "none",
    excludeCredentials: existingCreds.map((c) => ({ id: c.credentialId })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
  });

  req.session.challenge = options.challenge;
  req.session.pendingRegistration = {
    username: username.trim(),
    displayName: displayName.trim(),
    origin,
  };

  res.json(options);
});

// POST /auth/register/finish
router.post("/auth/register/finish", async (req, res): Promise<void> => {
  const body = req.body as RegistrationResponseJSON;
  const { challenge, pendingRegistration } = req.session;

  if (!challenge || !pendingRegistration) {
    res.status(400).json({ error: "Tidak ada sesi pendaftaran aktif" });
    return;
  }

  const { username, displayName, origin } = pendingRegistration;
  const rpID = new URL(origin).hostname;

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
    });
  } catch {
    res.status(400).json({ error: "Verifikasi biometrik gagal" });
    return;
  }

  if (!verification.verified || !verification.registrationInfo) {
    res.status(400).json({ error: "Biometrik tidak terverifikasi" });
    return;
  }

  const { credential, aaguid } = verification.registrationInfo;

  // Upsert user
  let userId: number;
  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));
  if (existingUser) {
    userId = existingUser.id;
  } else {
    const [newUser] = await db
      .insert(usersTable)
      .values({ username, displayName })
      .returning();
    userId = newUser.id;
  }

  // Store credential (upsert by credentialId)
  const publicKeyB64 = Buffer.from(credential.publicKey).toString("base64url");
  await db
    .insert(webauthnCredentialsTable)
    .values({
      userId,
      credentialId: credential.id,
      publicKey: publicKeyB64,
      counter: credential.counter,
      aaguid: aaguid ?? null,
      transports: JSON.stringify(body.response?.transports ?? []),
    })
    .onConflictDoUpdate({
      target: webauthnCredentialsTable.credentialId,
      set: { publicKey: publicKeyB64, counter: credential.counter },
    });

  req.session.challenge = undefined;
  req.session.pendingRegistration = undefined;
  req.session.userId = userId;

  res.json({
    ok: true,
    user: { id: userId, username, displayName },
  });
});

// POST /auth/login/begin
router.post("/auth/login/begin", async (req, res): Promise<void> => {
  const { username, origin } = req.body as { username?: string; origin?: string };
  if (!username?.trim() || !origin) {
    res.status(400).json({ error: "username dan origin wajib diisi" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.trim()));

  if (!user) {
    res.status(404).json({ error: "Pengguna tidak ditemukan" });
    return;
  }

  const credentials = await db
    .select()
    .from(webauthnCredentialsTable)
    .where(eq(webauthnCredentialsTable.userId, user.id));

  if (!credentials.length) {
    res.status(400).json({ error: "Belum ada biometrik terdaftar untuk akun ini" });
    return;
  }

  const rpID = new URL(origin).hostname;

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: credentials.map((c) => ({ id: c.credentialId })),
    userVerification: "required",
  });

  req.session.challenge = options.challenge;
  req.session.pendingAuth = { userId: user.id, origin };

  res.json(options);
});

// POST /auth/login/finish
router.post("/auth/login/finish", async (req, res): Promise<void> => {
  const body = req.body as AuthenticationResponseJSON;
  const { challenge, pendingAuth } = req.session;

  if (!challenge || !pendingAuth) {
    res.status(400).json({ error: "Tidak ada sesi login aktif" });
    return;
  }

  const { userId, origin } = pendingAuth;
  const rpID = new URL(origin).hostname;

  const [credential] = await db
    .select()
    .from(webauthnCredentialsTable)
    .where(eq(webauthnCredentialsTable.credentialId, body.id));

  if (!credential || credential.userId !== userId) {
    res.status(404).json({ error: "Credential tidak ditemukan" });
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
        id: credential.credentialId,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, "base64url")),
        counter: credential.counter,
        transports: JSON.parse(credential.transports ?? "[]"),
      },
      requireUserVerification: true,
    });
  } catch {
    res.status(400).json({ error: "Autentikasi biometrik gagal" });
    return;
  }

  if (!verification.verified) {
    res.status(400).json({ error: "Biometrik tidak terverifikasi" });
    return;
  }

  // Update replay-protection counter
  await db
    .update(webauthnCredentialsTable)
    .set({ counter: verification.authenticationInfo.newCounter })
    .where(eq(webauthnCredentialsTable.id, credential.id));

  req.session.challenge = undefined;
  req.session.pendingAuth = undefined;
  req.session.userId = userId;

  const [user] = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName })
    .from(usersTable)
    .where(eq(usersTable.id, userId));

  res.json({ ok: true, user });
});

// POST /auth/logout
router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout gagal" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
});

export default router;
