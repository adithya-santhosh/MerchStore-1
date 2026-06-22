import { Request, Response } from "express";
import { registerUser, loginUser, getUserById } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error("Error in register controller:", error);
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
    res.json(result);
  } catch (error: any) {
    console.error("Error in login controller:", error);
    res.status(401).json({ message: error.message || "Invalid credentials" });
  }
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
    console.error("Error in me controller:", error);
    res.status(500).json({ message: "Failed to retrieve user details" });
  }
};
