import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { requireAuth, requireAdmin, requireVendor, optionalAuth } from "./auth.middleware";

const JWT_SECRET = process.env.JWT_SECRET!;

const signToken = (payload: object) => jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

const mockReq = (headers: Record<string, string> = {}): Request =>
  ({ headers, user: undefined } as unknown as Request);

describe("requireAuth", () => {
  it("rejects a request with no token", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects an invalid/expired token", () => {
    const req = mockReq({ authorization: "Bearer not-a-real-token" });
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches req.user and calls next() for a valid Bearer token", () => {
    const token = signToken({ id: 1, email: "a@b.com", role: "CUSTOMER", firstName: "A", lastName: "B" });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toMatchObject({ id: 1, email: "a@b.com", role: "CUSTOMER" });
  });

  it("falls back to reading the token from a cookie", () => {
    const token = signToken({ id: 2, email: "c@d.com", role: "CUSTOMER", firstName: "C", lastName: "D" });
    const req = mockReq({ cookie: `role=CUSTOMER; token=${token}` });
    const res = mockRes();
    const next = vi.fn();

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user?.id).toBe(2);
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
  it("proceeds as a guest (no throw, no req.user) when the token is invalid", () => {
    const req = mockReq({ authorization: "Bearer garbage" });
    const res = mockRes();
    const next = vi.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });

  it("attaches req.user when a valid token is present", () => {
    const token = signToken({ id: 5, email: "e@f.com", role: "CUSTOMER", firstName: "E", lastName: "F" });
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = vi.fn();

    optionalAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user?.id).toBe(5);
  });
});
