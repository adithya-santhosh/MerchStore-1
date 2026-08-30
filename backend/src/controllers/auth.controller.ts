import logger from "../lib/logger";
import { Request, Response } from "express";
import { registerUser, loginUser, getUserById, updateUserProfile, becomeMemberUser, requestPasswordReset, resetPassword, changeUserPassword, verifyEmailToken, resendVerificationEmail } from "../services/auth.service";

// Auth cookie settings live in lib/auth-cookie.ts — see the notes there on why
// SameSite depends on whether the frontend and API share a registrable domain.
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_OPTIONS,
  AUTH_COOKIE_MAX_AGE,
} from "../lib/auth-cookie";

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
    const result = await changeUserPassword(req.user.id, currentPassword, newPassword);
    // The password change invalidated the token this request authenticated
    // with, so re-issue the cookie with the fresh one or the user gets logged
    // out by the very request that changed their password.
    res.cookie(AUTH_COOKIE_NAME, result.token, { ...AUTH_COOKIE_OPTIONS, maxAge: AUTH_COOKIE_MAX_AGE });
    res.json({ message: result.message });
  } catch (error: any) {
    logger.error({ err: error }, "Error in changePassword controller");
    res.status(400).json({ message: error.message || "Failed to change password" });
  }
};




export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token || typeof token !== "string") {
      return res.status(400).json({ message: "Verification token is required" });
    }
    const result = await verifyEmailToken(token);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error in verifyEmail controller");
    res.status(400).json({ message: error.message || "Failed to verify email" });
  }
};

export const resendVerification = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const result = await resendVerificationEmail(req.user.id);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error in resendVerification controller");
    res.status(400).json({ message: error.message || "Failed to resend verification email" });
  }
};
