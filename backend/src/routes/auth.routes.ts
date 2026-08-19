import { Router } from "express";
import { register, login, me, updateProfile, becomeMember, forgotPassword, resetPasswordHandler } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate, registerSchema, loginSchema, updateProfileSchema } from "../middleware/validation.middleware";

const router = Router();

// Public — with input validation
router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password",  resetPasswordHandler);

// Protected
router.get("/me",            requireAuth, me);
router.put("/profile",       requireAuth, validate(updateProfileSchema), updateProfile);
router.post("/become-member",requireAuth, becomeMember);

export default router;

