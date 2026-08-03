---
name: WebAuthn auth architecture
description: How biometric login is implemented — packages, flow, and Replit-specific caveats
---

## Stack
- `@simplewebauthn/server` v13 (api-server) + `@simplewebauthn/browser` v13 (idt-management)
- `express-session` + `connect-pg-simple` (sessions stored in `session` table, auto-created via `createTableIfMissing: true`)
- DB tables: `users` (id, username, displayName, createdAt) + `webauthn_credentials` (credentialId, publicKey as base64url, counter, transports as JSON string)

## Origin / RP-ID handling
The client passes `window.location.origin` in every `/auth/register/begin` and `/auth/login/begin` request body. The server derives `rpID = new URL(origin).hostname` from this. This avoids hardcoding domains and survives Replit's proxy chain where `req.headers.origin` may not reflect the actual browser origin.

## Session cookie
`app.set('trust proxy', 1)` is required. `secure: process.env.NODE_ENV === 'production'` — leave false in dev because Vite+Replit proxy chain complicates secure-cookie propagation.

## Auth guard
In `routes/index.ts`: health + auth routes are public; a `requireAuth` middleware sits between them and the protected units/settings routers.

## 401 in browser console on load is expected
`useAuth` in the frontend calls `/api/auth/me`, gets 401, returns `null`, app renders `<LoginPage>`. This is correct and not an error.

**Why:** Deriving rpID from the client-sent origin is the only reliable approach behind multiple proxy layers (Replit HTTPS proxy → Vite dev proxy → Express).
