import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRole } from "../generated/prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_fallback_key";

export const registerUser = async (data: any) => {
  const email = data.email.toLowerCase().trim();
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Auto-make admin if email is admin@merchstore.com or if database is empty of users
  const userCount = await prisma.user.count();
  const isFirstOrAdminEmail = email === "admin@merchstore.com" || userCount === 0;
  const role: UserRole = isFirstOrAdminEmail ? UserRole.ADMIN : UserRole.CUSTOMER;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone || null,
      role
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
      createdAt: user.createdAt
    },
    token
  };
};

export const loginUser = async (data: any) => {
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
      createdAt: user.createdAt
    },
    token
  };
};

export const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id }
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt
  };
};
