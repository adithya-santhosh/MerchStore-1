import { Router } from "express";
import { getSystemSettings, editSystemSettings } from "../controllers/settings.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/", getSystemSettings);
router.put("/", requireAuth, requireAdmin, editSystemSettings);

export default router;

