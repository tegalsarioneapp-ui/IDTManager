import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { sessionMiddleware } from "./lib/session";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust Replit's reverse proxy so req.secure works and session cookies behave correctly
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Global error handler — must be registered after all routes.
// Express 5 automatically forwards async route errors here.
// Without this, errors produce an HTML response; this ensures JSON always.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : "Internal server error";
  logger.error({ err }, "Unhandled route error");
  res.status(500).json({ error: message });
});

export default app;
