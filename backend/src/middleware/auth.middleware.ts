import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import prisma from "../lib/prisma";
import { parseCookies, requiresCsrfCheck, csrfTokenIsValid } from "../lib/csrf";

// ─── JWT Payload Type ─────────────────────────────────────────────────────────
interface JwtPayload {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  // Absent on tokens issued before this field existed — treated as 0.
  tokenVersion?: number;
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

  return parseCookies(req)["token"];
};

// ─── Session revocation check ─────────────────────────────────────────────────
// A JWT is normally stateless, but that means changing a password can't
// invalidate tokens already issued — the old one keeps working for its full
// 7-day life. tokenVersion closes that gap: it's bumped in the DB on every
// password change, so a token signed before that change no longer matches.
const isSessionRevoked = async (decoded: JwtPayload): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { tokenVersion: true },
  });
  if (!user) return true;
  return (decoded.tokenVersion ?? 0) !== user.tokenVersion;
};

// ─── requireAuth — blocks unauthenticated requests ───────────────────────────
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: "Authentication token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (await isSessionRevoked(decoded)) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    // Only meaningful when the request just authenticated off the cookie: a
    // cross-site page can get the victim's browser to attach that cookie
    // automatically, but can't read it to forge a matching header. A request
    // that supplied its own Authorization header isn't riding an ambient
    // credential, so nothing here for CSRF to protect.
    if (requiresCsrfCheck(req) && !csrfTokenIsValid(req)) {
      return res.status(403).json({ message: "Invalid or missing CSRF token" });
    }

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
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!(await isSessionRevoked(decoded))) {
        // A guest's cart identity travels in the request body/localStorage,
        // never an ambient cookie, so CSRF only applies once we know this
        // request is actually authenticated — a forged cross-site request
        // has no reason to carry a real session's CSRF header.
        if (requiresCsrfCheck(req) && !csrfTokenIsValid(req)) {
          return res.status(403).json({ message: "Invalid or missing CSRF token" });
        }

        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          firstName: decoded.firstName || "",
          lastName: decoded.lastName || "",
        };
      }
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
