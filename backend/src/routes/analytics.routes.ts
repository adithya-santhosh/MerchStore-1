import { Router } from "express";
import { getDashboard } from "../controllers/analytics.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/dashboard", requireAuth, requireAdmin, getDashboard);

export default router;
