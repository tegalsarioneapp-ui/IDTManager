import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";

// Augment express-session SessionData with app-specific fields
declare module "express-session" {
  interface SessionData {
    userId?: number;
    challenge?: string;
  }
}

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    createTableIfMissing: true,
    // prune expired sessions every hour
    pruneSessionInterval: 60 * 60,
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // Replit proxies HTTPS → HTTP internally; cookies still need to work in dev
    secure: process.env["NODE_ENV"] === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
});
