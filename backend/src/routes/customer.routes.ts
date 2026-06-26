import { Router } from "express";
import { listCustomers, getCustomer, getCustomerStatsCtrl } from "../controllers/customer.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.get("/admin/stats", requireAuth, requireAdmin, getCustomerStatsCtrl);
router.get("/admin", requireAuth, requireAdmin, listCustomers);
router.get("/admin/:id", requireAuth, requireAdmin, getCustomer);

export default router;
