import logger from "../lib/logger";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserRole } from "@prisma/client";
import { sendWelcomeEmail, sendPasswordResetEmail, sendEmailVerification } from "./email.service";
import { createEmailVerificationToken, readEmailVerificationToken } from "../lib/email-verification";

// JWT_SECRET is guaranteed to be set — server.ts exits at startup if it isn't
const JWT_SECRET = process.env.JWT_SECRET!;

// ─── Account Lockout ──────────────────────────────────────────────────────────
// A shared IP rate limit (see app.ts) slows brute-forcing but doesn't stop it —
// a distributed attacker still gets unlimited guesses at one account's
// password. These bound guesses per *account* regardless of source IP.
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ─── Input Types ──────────────────────────────────────────────────────────────
interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  isMember?: boolean;
}

interface LoginInput {
  email: string;
  password: string;
  sessionToken?: string;
}

/** Minimal shape signAuthToken needs — satisfied by any full User row. */
interface SignableUser {
  id: number;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  tokenVersion: number;
}

export const signAuthToken = (user: SignableUser): string =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      tokenVersion: user.tokenVersion
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

export const registerUser = async (data: RegisterInput) => {
  const email = data.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Only the very first genuinely registered user becomes ADMIN — a guest
  // checkout account (see resolveGuestUser) doesn't count, or a store's first
  // real visitor placing a guest order before the owner ever registers would
  // permanently block the bootstrap admin from ever being granted.
  const userCount = await prisma.user.count({ where: { isGuest: false } });
  const role: UserRole = userCount === 0 ? UserRole.ADMIN : UserRole.CUSTOMER;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone || null,
      role,
      isMember: false
    }
  });

  // Asynchronously send welcome email without blocking user registration
  sendWelcomeEmail({
    to: user.email,
    name: `${user.firstName} ${user.lastName}`
  }).catch((err) => logger.error({ err: err }, "[AuthService] Welcome email background error"));

  // Same for the confirmation link — registration must succeed even if mail does not.
  sendVerificationEmailFor(user).catch((err) =>
    logger.error({ err }, "[AuthService] Verification email background error")
  );

  const token = signAuthToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      isMember: user.isMember,
    emailVerified: user.emailVerified
    },
    token
  };
};

export const loginUser = async (data: LoginInput) => {
  const email = data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    throw new Error(
      `Too many failed login attempts. Please try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`
    );
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    const attempts = user.failedLoginAttempts + 1;
    const locksOut = attempts >= MAX_FAILED_LOGIN_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        // Counter resets alongside the lock itself, so it starts fresh once
        // the lockout window passes rather than re-triggering on attempt 1.
        failedLoginAttempts: locksOut ? 0 : attempts,
        lockedUntil: locksOut ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });
    throw new Error("Invalid email or password");
  }

  // A stale lockedUntil can still be sitting here if the window simply
  // expired rather than being cleared by a fresh failed attempt.
  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  if (data.sessionToken) {
    const guestCart = await prisma.cart.findFirst({
      where: {
        sessionToken: data.sessionToken
      },
      include: {
        items: true
      }
    });

    if (guestCart) {
      const userCart = await prisma.cart.findFirst({
        where: {
          userId: user.id
        },
        include: {
          items: true
        }
      });

      if (!userCart) {
        // Link guest cart to user
        await prisma.cart.update({
          where: {
            id: guestCart.id
          },
          data: {
            userId: user.id,
            sessionToken: null
          }
        });
      } else {
        // Merge guest cart items into user cart
        for (const guestItem of guestCart.items) {
          const matchingUserItem = userCart.items.find(
            (item) => item.productId === guestItem.productId
          );

          if (matchingUserItem) {
            // Combine quantities
            await prisma.cartItem.update({
              where: { id: matchingUserItem.id },
              data: { quantity: matchingUserItem.quantity + guestItem.quantity }
            });
          } else {
            // Reassign guest item to the user's cart
            await prisma.cartItem.update({
              where: { id: guestItem.id },
              data: { cartId: userCart.id }
            });
          }
        }

        // Delete guest cart
        await prisma.cart.delete({
          where: { id: guestCart.id }
        });
      }
    }
  }

  const token = signAuthToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      isMember: user.isMember,
    emailVerified: user.emailVerified
    },
    token
  };
};

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true
    }
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
    phone: user.phone,
    isMember: user.isMember,
    emailVerified: user.emailVerified,
    addresses: user.addresses
  };
};

export const updateUserProfile = async (id: number, data: { firstName: string; lastName: string; phone?: string | null }) => {
  const user = await prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone ? data.phone.trim() : null
    },
    include: {
      addresses: true
    }
  });
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
    phone: user.phone,
    isMember: user.isMember,
    emailVerified: user.emailVerified,
    addresses: user.addresses
  };
};

export const becomeMemberUser = async (id: number) => {
  const user = await prisma.user.update({
    where: { id },
    data: { isMember: true }
  });
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
    phone: user.phone,
    isMember: user.isMember,
    emailVerified: user.emailVerified
  };
};

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  // Always return success message to prevent email enumeration
  if (!user) {
    return { message: "If an account with that email exists, a password reset link has been sent." };
  }

  // Generate 32-byte secure random hex token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes expiry

  // Invalidate any existing unused reset tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() }
  });

  // Save new token hash
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt
    }
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

  // Send password reset email asynchronously
  sendPasswordResetEmail({
    to: user.email,
    name: `${user.firstName} ${user.lastName}`,
    resetUrl
  }).catch((err) => logger.error({ err: err }, "[AuthService] Reset password email background error"));

  return { message: "If an account with that email exists, a password reset link has been sent." };
};

export const resetPassword = async (rawToken: string, newPassword: string) => {
  if (!rawToken || !newPassword || newPassword.length < 8) {
    throw new Error("Invalid request. Password must be at least 8 characters.");
  }

  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!resetToken) {
    throw new Error("Invalid or expired password reset token.");
  }

  if (resetToken.usedAt !== null) {
    throw new Error("This password reset link has already been used.");
  }

  if (resetToken.expiresAt < new Date()) {
    throw new Error("This password reset link has expired. Please request a new one.");
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update user password and mark token as used. Bumping tokenVersion
  // invalidates every JWT issued before this point, on every device.
  // Proving ownership via emailed link also clears any lockout — no reason
  // to keep the account locked once the legitimate owner has reset it.
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: {
      passwordHash: newPasswordHash,
      tokenVersion: { increment: 1 },
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });

  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() }
  });

  return { message: "Password updated successfully. You can now log in with your new password." };
};

export const changeUserPassword = async (userId: number, currentPassword: string, newPassword: string) => {
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters long.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    throw new Error("Current password is incorrect.");
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  // tokenVersion increments so every other session is invalidated. The caller
  // is authenticated right now with a token about to become stale, so hand
  // back a freshly signed one carrying the new version — otherwise changing
  // your own password would log you out of the request you just made it with.
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, tokenVersion: { increment: 1 } }
  });

  const token = signAuthToken(updated);

  return { message: "Password updated successfully.", token };
};




// ─── Email Verification ───────────────────────────────────────────────────────

/**
 * Builds the verification link and emails it. Fire-and-forget at the call site:
 * a failure here must never block registration.
 */
export const sendVerificationEmailFor = async (user: {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}) => {
  const token = createEmailVerificationToken(user.id, user.email);
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

  await sendEmailVerification({
    to: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    verifyUrl,
  });
};

export const verifyEmailToken = async (token: string) => {
  const payload = readEmailVerificationToken(token);
  if (!payload) {
    throw new Error("This verification link is invalid or has expired. Request a new one from your account page.");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new Error("This verification link is invalid or has expired. Request a new one from your account page.");
  }

  // The token carries the address it was issued for; if the account's email has
  // since changed, the old link must not verify the new address.
  if (user.email !== payload.email) {
    throw new Error("This link was issued for a different email address. Request a new one from your account page.");
  }

  if (user.emailVerified) {
    return { message: "Your email is already confirmed.", alreadyVerified: true };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true },
  });

  return { message: "Email confirmed. Thanks!", alreadyVerified: false };
};

export const resendVerificationEmail = async (userId: number) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.emailVerified) {
    return { message: "Your email is already confirmed." };
  }

  await sendVerificationEmailFor(user);
  return { message: "Verification email sent. Check your inbox." };
};

// ─── Guest Checkout ─────────────────────────────────────────────────────────

export interface GuestContactInput {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
}

/**
 * Resolves a guest checkout to a User row without ever asking them to set a
 * password — creating one with an unguessable random hash if this is their
 * first guest order, or reusing the same one on a repeat guest order (also
 * covers the two-step Razorpay flow, which resolves this twice per checkout:
 * once to create the payment order, again to verify it).
 *
 * If the email already belongs to a real registered account, this refuses
 * rather than silently attaching the order to a stranger's account — they're
 * told to log in instead.
 */
export const resolveGuestUser = async (data: GuestContactInput) => {
  const email = data.email.toLowerCase().trim();
  const alreadyRegistered = "An account already exists with this email. Please log in to continue.";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (!existing.isGuest) throw new Error(alreadyRegistered);
    return existing;
  }

  const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);

  try {
    return await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone?.trim() || null,
        role: UserRole.CUSTOMER,
        isGuest: true,
      }
    });
  } catch (err: any) {
    // Unique constraint race: another request resolved the same email between
    // our lookup and create (e.g. the create-order and verify legs of a
    // Razorpay checkout firing close together). Re-fetch and treat it exactly
    // like the found-above case rather than surfacing a raw DB error.
    if (err.code === "P2002") {
      const raceWinner = await prisma.user.findUnique({ where: { email } });
      if (raceWinner?.isGuest) return raceWinner;
      throw new Error(alreadyRegistered);
    }
    throw err;
  }
};
