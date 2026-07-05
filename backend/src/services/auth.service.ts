import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

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
      isMember: !!data.isMember
    }
  });

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

