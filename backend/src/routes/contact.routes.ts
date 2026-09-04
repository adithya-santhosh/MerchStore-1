import { Router } from "express";
import rateLimit from "express-rate-limit";
import { submitContactMessageCtrl, getContactMessagesCtrl } from "../controllers/contact.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { validate, contactMessageSchema } from "../middleware/validation.middleware";

const router = Router();

// Tighter than the general API limit — this is a public, unauthenticated,
// mail-sending endpoint, so an obvious spam/abuse target.
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages sent. Please try again later." },
});

router.post("/", contactLimiter, validate(contactMessageSchema), submitContactMessageCtrl);
router.get("/", requireAuth, requireAdmin, getContactMessagesCtrl);

export default router;
