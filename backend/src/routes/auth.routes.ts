import { Router } from "express";
import { register, login, logout, me, updateProfile, becomeMember, forgotPassword, resetPasswordHandler, changePassword } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../middleware/validation.middleware";

const router = Router();

// Public — with input validation
router.post("/register", validate(registerSchema), register);
router.post("/login",    validate(loginSchema),    login);
router.post("/logout",   logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password",  validate(resetPasswordSchema),  resetPasswordHandler);

// Protected
router.get("/me",            requireAuth, me);
router.put("/profile",       requireAuth, validate(updateProfileSchema), updateProfile);
router.put("/change-password", requireAuth, validate(changePasswordSchema), changePassword);
router.post("/become-member",requireAuth, becomeMember);

export default router;


