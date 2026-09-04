import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";

vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn() } },
}));

import prisma from "../../src/lib/prisma";
import { requireAuth, requireAdmin, requireVendor, optionalAuth } from "../../src/middleware/auth.middleware";

const mockedPrisma = vi.mocked(prisma, true);
const JWT_SECRET = process.env.JWT_SECRET!;

const signToken = (payload: object) => jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

beforeEach(() => {
  vi.clearAllMocks();
  // Matches the default tokenVersion (0) and the tokens signed below, which
  // don't carry a tokenVersion claim at all — treated as 0.
  mockedPrisma.user.findUnique.mockResolvedValue({ tokenVersion: 0 } as any);
});

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

const mockReq = (headers: Record<string, string> = {}, method = "GET"): Request =>
  ({ headers, method, user: undefined } as unknown as Request);

describe("requireAuth", () => {
  it("rejects a request with no token", async () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid/expired token", async () => {
    const req = mockReq({ authorization: "Bearer not-a-real-token" });
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next() for a valid Bearer token", async () => {
    const token = signToken({ id: 1, email: "a@b.com", role: "CUSTOMER", firstName: "A", lastName: "B" });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ id: 1, email: "a@b.com", role: "CUSTOMER" });
  });

  it("falls back to reading the token from a cookie", async () => {
    const token = signToken({ id: 2, email: "c@d.com", role: "CUSTOMER", firstName: "C", lastName: "D" });
    const req = mockReq({ cookie: `role=CUSTOMER; token=${token}` });
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user?.id).toBe(2);
  });

  it("rejects a token whose tokenVersion is stale — the point of a password change invalidating other sessions", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ tokenVersion: 3 } as any);
    const token = signToken({
      id: 1,
      email: "a@b.com",
      role: "CUSTOMER",
      firstName: "A",
      lastName: "B",
      tokenVersion: 2, // signed before the password change that bumped it to 3
    });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts a token whose tokenVersion matches the current one", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ tokenVersion: 3 } as any);
    const token = signToken({
      id: 1,
      email: "a@b.com",
      role: "CUSTOMER",
      firstName: "A",
      lastName: "B",
      tokenVersion: 3,
    });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects a token for a user that no longer exists", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    const token = signToken({ id: 999, email: "gone@b.com", role: "CUSTOMER", firstName: "A", lastName: "B" });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  describe("CSRF", () => {
    const cookieAuth = (id: number, extra: Record<string, any> = {}) => {
      const token = signToken({ id, email: "a@b.com", role: "CUSTOMER", firstName: "A", lastName: "B", ...extra });
      return `token=${token}`;
    };

    it("rejects a cookie-authenticated mutating request with no CSRF header", async () => {
      const req = mockReq({ cookie: cookieAuth(1) }, "POST");
      const res = mockRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("rejects a cookie-authenticated mutating request whose CSRF header doesn't match the cookie", async () => {
      const req = mockReq(
        { cookie: `${cookieAuth(1)}; csrf_token=real-value`, "x-csrf-token": "attacker-guess" },
        "POST"
      );
      const res = mockRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("accepts a cookie-authenticated mutating request whose CSRF header matches the cookie", async () => {
      const req = mockReq(
        { cookie: `${cookieAuth(1)}; csrf_token=real-value`, "x-csrf-token": "real-value" },
        "POST"
      );
      const res = mockRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it("does not require a CSRF header for a cookie-authenticated GET", async () => {
      const req = mockReq({ cookie: cookieAuth(1) }, "GET");
      const res = mockRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });

    it("does not require a CSRF header when the request supplies its own Authorization header", async () => {
      const token = signToken({ id: 1, email: "a@b.com", role: "CUSTOMER", firstName: "A", lastName: "B" });
      const req = mockReq({ authorization: `Bearer ${token}` }, "POST");
      const res = mockRes();
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(next).toHaveBeenCalledOnce();
    });
  });
});

describe("requireAdmin", () => {
  it("blocks a non-admin user", () => {
    const req = { user: { id: 1, email: "a@b.com", role: "CUSTOMER", firstName: "", lastName: "" } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows an admin user through", () => {
    const req = { user: { id: 1, email: "a@b.com", role: "ADMIN", firstName: "", lastName: "" } } as Request;
    const res = mockRes();
    const next = vi.fn();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});

describe("requireVendor", () => {
  it("allows VENDOR and ADMIN roles, blocks everything else", () => {
    const next = vi.fn();
    const res = mockRes();

    requireVendor({ user: { id: 1, email: "", role: "VENDOR", firstName: "", lastName: "" } } as Request, res, next);
    requireVendor({ user: { id: 1, email: "", role: "ADMIN", firstName: "", lastName: "" } } as Request, res, next);
    expect(next).toHaveBeenCalledTimes(2);

    const blockedRes = mockRes();
    requireVendor({ user: { id: 1, email: "", role: "CUSTOMER", firstName: "", lastName: "" } } as Request, blockedRes, vi.fn());
    expect(blockedRes.status).toHaveBeenCalledWith(403);
  });
});

describe("optionalAuth", () => {
  it("proceeds as a guest (no throw, no req.user) when the token is invalid", async () => {
    const req = mockReq({ authorization: "Bearer garbage" });
    const res = mockRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });

  it("attaches req.user when a valid token is present", async () => {
    const token = signToken({ id: 5, email: "e@f.com", role: "CUSTOMER", firstName: "E", lastName: "F" });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user?.id).toBe(5);
  });

  it("proceeds as a guest, not an error, when tokenVersion is stale", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ tokenVersion: 3 } as any);
    const token = signToken({
      id: 5,
      email: "e@f.com",
      role: "CUSTOMER",
      firstName: "E",
      lastName: "F",
      tokenVersion: 1,
    });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    await optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });

  describe("CSRF", () => {
    it("rejects a cookie-authenticated mutating request with no CSRF header", async () => {
      const token = signToken({ id: 5, email: "e@f.com", role: "CUSTOMER", firstName: "E", lastName: "F" });
      const req = mockReq({ cookie: `token=${token}` }, "POST");
      const res = mockRes();
      const next = vi.fn();

      await optionalAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("accepts a cookie-authenticated mutating request with a matching CSRF header", async () => {
      const token = signToken({ id: 5, email: "e@f.com", role: "CUSTOMER", firstName: "E", lastName: "F" });
      const req = mockReq(
        { cookie: `token=${token}; csrf_token=real-value`, "x-csrf-token": "real-value" },
        "POST"
      );
      const res = mockRes();
      const next = vi.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.user?.id).toBe(5);
    });

    it("does not require a CSRF header for a genuine guest — no token at all", async () => {
      const req = mockReq({}, "POST");
      const res = mockRes();
      const next = vi.fn();

      await optionalAuth(req, res, next);

      expect(next).toHaveBeenCalledOnce();
      expect(req.user).toBeUndefined();
    });
  });
});
