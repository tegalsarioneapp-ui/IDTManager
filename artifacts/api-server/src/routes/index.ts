import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import unitsRouter from "./units";
import settingsRouter from "./settings";

const router: IRouter = Router();

// Public routes (no auth required)
router.use(healthRouter);
router.use(authRouter);

// ─── Auth guard ─────────────────────────────────────────────────────────────
// All routes registered after this middleware require an active session.
router.use((req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Tidak terautentikasi" });
    return;
  }
  next();
});

// Protected routes
router.use(unitsRouter);
router.use(settingsRouter);

export default router;
