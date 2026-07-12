import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";

// ─── JWT Payload Type ─────────────────────────────────────────────────────────
interface JwtPayload {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  iat: number;
  exp: number;
}

// ─── Extend Express Request ───────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

// JWT_SECRET is guaranteed to be set — server.ts exits at startup if it isn't
const JWT_SECRET = process.env.JWT_SECRET!;

// ─── Helper: extract token from Authorization header or cookie ────────────────
const extractToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }

  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc, c) => {
      const [k, v] = c.trim().split("=");
      if (k && v) acc[k] = decodeURIComponent(v);
      return acc;
    }, {} as Record<string, string>);
    return cookies["token"];
  }

  return undefined;
};

// ─── requireAuth — blocks unauthenticated requests ───────────────────────────
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName || "",
      lastName: decoded.lastName || "",
    };

    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session token" });
  }
};

// ─── requireAdmin — requires ADMIN role after requireAuth ────────────────────
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Access Denied: Admins Only" });
  }
  next();
};

// ─── optionalAuth — attaches user if token present, continues as guest if not
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        firstName: decoded.firstName || "",
        lastName: decoded.lastName || "",
      };
    }
  } catch {
    // Token invalid — proceed as unauthenticated guest
  }
  next();
};

// ─── requireVendor — allows VENDOR or ADMIN roles ─────────────────────────────
export const requireVendor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.user.role !== "VENDOR" && req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Access Denied: Vendors Only" });
  }
  next();
};
