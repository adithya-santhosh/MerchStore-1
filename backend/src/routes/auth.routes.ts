import { Router } from "express";
import { register, login, me, updateProfile, becomeMember } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate, registerSchema, loginSchema } from "../middleware/validation.middleware";

const router = Router();

// Public — with input validation
router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);

// Protected
router.get("/me",            requireAuth, me);
router.put("/profile",       requireAuth, updateProfile);
router.post("/become-member",requireAuth, becomeMember);

export default router;
