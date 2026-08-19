import logger from "../lib/logger";
import { Request, Response } from "express";
import { registerUser, loginUser, getUserById, updateUserProfile, becomeMemberUser, requestPasswordReset, resetPassword, changeUserPassword } from "../services/auth.service";

// ─── Auth Cookie ──────────────────────────────────────────────────────────────
// The JWT is set as an HttpOnly cookie so client-side JS (and therefore XSS)
// can never read it. `sameSite: "none"` is required when the frontend and
// backend live on different sites (typical prod deploy); "lax" is used in
// dev where both run on localhost (same-site, different port).
const AUTH_COOKIE_NAME = "token";
const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  path: "/",
};
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days — matches JWT expiry

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await registerUser(req.body);
    res.cookie(AUTH_COOKIE_NAME, result.token, { ...AUTH_COOKIE_OPTIONS, maxAge: AUTH_COOKIE_MAX_AGE });
    res.status(201).json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error in register controller");
    res.status(400).json({ message: error.message || "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await loginUser(req.body);
    res.cookie(AUTH_COOKIE_NAME, result.token, { ...AUTH_COOKIE_OPTIONS, maxAge: AUTH_COOKIE_MAX_AGE });
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error in login controller");
    res.status(401).json({ message: error.message || "Invalid credentials" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, AUTH_COOKIE_OPTIONS);
  res.json({ message: "Logged out successfully" });
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    logger.error({ err: error }, "Error in me controller");
    res.status(500).json({ message: "Failed to retrieve user details" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { firstName, lastName, phone } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    const updatedUser = await updateUserProfile(req.user.id, { firstName, lastName, phone });
    res.json(updatedUser);
  } catch (error: any) {
    logger.error({ err: error }, "Error in updateProfile controller");
    res.status(500).json({ message: error.message || "Failed to update profile" });
  }
};

export const becomeMember = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const updatedUser = await becomeMemberUser(req.user.id);
    res.json(updatedUser);
  } catch (error: any) {
    logger.error({ err: error }, "Error in becomeMember controller");
    res.status(500).json({ message: error.message || "Failed to activate membership" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await requestPasswordReset(email);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error in forgotPassword controller");
    res.status(400).json({ message: error.message || "Failed to process password reset request" });
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }
    const result = await resetPassword(token, newPassword);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error in resetPasswordHandler controller");
    res.status(400).json({ message: error.message || "Failed to reset password" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    const result = await changeUserPassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error in changePassword controller");
    res.status(400).json({ message: error.message || "Failed to change password" });
  }
};



