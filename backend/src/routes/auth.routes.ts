import { Router } from "express";
import { register, login, me, updateProfile, becomeMember } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.post("/become-member", requireAuth, becomeMember);

export default router;
