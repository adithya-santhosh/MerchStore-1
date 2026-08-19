import logger from "../lib/logger";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { UserRole } from "@prisma/client";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./email.service";

// JWT_SECRET is guaranteed to be set — server.ts exits at startup if it isn't
const JWT_SECRET = process.env.JWT_SECRET!;

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

  // Only the very first registered user becomes ADMIN
  const userCount = await prisma.user.count();
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

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      isMember: user.isMember
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

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
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

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
      isMember: user.isMember
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
    isMember: user.isMember
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
  if (!rawToken || !newPassword || newPassword.length < 6) {
    throw new Error("Invalid request. Password must be at least 6 characters.");
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

  // Update user password and mark token as used
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash: newPasswordHash }
  });

  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() }
  });

  return { message: "Password updated successfully. You can now log in with your new password." };
};

export const changeUserPassword = async (userId: number, currentPassword: string, newPassword: string) => {
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters long.");
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
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash }
  });

  return { message: "Password updated successfully." };
};



