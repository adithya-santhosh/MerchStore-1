"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../generated/prisma/client");
// JWT_SECRET is guaranteed to be set — server.ts exits at startup if it isn't
const JWT_SECRET = process.env.JWT_SECRET;
// ─── Helper: extract token from Authorization header or cookie ────────────────
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.split(" ")[1];
    }
    if (req.headers.cookie) {
        const cookies = req.headers.cookie.split(";").reduce((acc, c) => {
            const [k, v] = c.trim().split("=");
            if (k && v)
                acc[k] = decodeURIComponent(v);
            return acc;
        }, {});
        return cookies["token"];
    }
    return undefined;
};
// ─── requireAuth — blocks unauthenticated requests ───────────────────────────
const requireAuth = (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ message: "Authentication token required" });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            firstName: decoded.firstName || "",
            lastName: decoded.lastName || "",
        };
        next();
    }
    catch {
        return res.status(401).json({ message: "Invalid or expired session token" });
    }
};
exports.requireAuth = requireAuth;
// ─── requireAdmin — requires ADMIN role after requireAuth ────────────────────
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== client_1.UserRole.ADMIN) {
        return res.status(403).json({ message: "Access Denied: Admins Only" });
    }
    next();
};
exports.requireAdmin = requireAdmin;
// ─── optionalAuth — attaches user if token present, continues as guest if not
const optionalAuth = (req, res, next) => {
    try {
        const token = extractToken(req);
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                firstName: decoded.firstName || "",
                lastName: decoded.lastName || "",
            };
        }
    }
    catch {
        // Token invalid — proceed as unauthenticated guest
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.middleware.js.map