import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/coupon.service", () => ({
  getAllCoupons: vi.fn(),
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
  validateCoupon: vi.fn(),
}));

// requireAuth checks tokenVersion against the DB on every request.
vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import app from "../../src/app";
import * as couponService from "../../src/services/coupon.service";

const svc = vi.mocked(couponService);
const JWT_SECRET = process.env.JWT_SECRET!;

const tokenWithRole = (role: string) =>
  jwt.sign({ id: 7, email: "u@example.com", role, firstName: "U", lastName: "R" }, JWT_SECRET, {
    expiresIn: "1h",
  });

const adminAuth = `Bearer ${tokenWithRole("ADMIN")}`;
const customerAuth = `Bearer ${tokenWithRole("CUSTOMER")}`;

/**
 * /api/coupons/validate is separately limited to 30 attempts per IP per 15
 * minutes, so brute-forcing codes is capped. Tests use distinct client IPs.
 */
let ipCounter = 0;
const nextIp = () => {
  ipCounter += 1;
  return `172.16.${Math.floor(ipCounter / 254)}.${(ipCounter % 254) + 1}`;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("coupon admin routes — access control", () => {
  it.each([
    ["get", "/api/coupons"],
    ["post", "/api/coupons"],
    ["put", "/api/coupons/1"],
    ["delete", "/api/coupons/1"],
  ])("rejects an anonymous %s %s with 401", async (method, path) => {
    const res = await (request(app) as any)[method](path);

    expect(res.status).toBe(401);
  });

  it.each([
    ["get", "/api/coupons"],
    ["post", "/api/coupons"],
    ["put", "/api/coupons/1"],
    ["delete", "/api/coupons/1"],
  ])("rejects a customer's %s %s with 403", async (method, path) => {
    const res = await (request(app) as any)[method](path).set("Authorization", customerAuth);

    expect(res.status).toBe(403);
  });

  it("never lets a customer read the coupon list", async () => {
    await request(app).get("/api/coupons").set("Authorization", customerAuth);

    // Leaking every active code would let anyone claim the best discount.
    expect(svc.getAllCoupons).not.toHaveBeenCalled();
  });
});

describe("POST /api/coupons", () => {
  it("rejects a missing discount type with 422", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", adminAuth)
      .send({ code: "SAVE10", value: 10 });

    expect(res.status).toBe(422);
    expect(svc.createCoupon).not.toHaveBeenCalled();
  });

  it("rejects an unknown discount type with 422", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", adminAuth)
      .send({ code: "SAVE10", type: "buy-one-get-one", value: 10 });

    expect(res.status).toBe(422);
  });

  it("rejects a non-positive discount value with 422", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", adminAuth)
      .send({ code: "SAVE10", type: "percent", value: 0 });

    expect(res.status).toBe(422);
  });

  it("uppercases the code before it reaches the service", async () => {
    svc.createCoupon.mockResolvedValue({ id: 1, code: "SAVE10" } as any);

    await request(app)
      .post("/api/coupons")
      .set("Authorization", adminAuth)
      .send({ code: "save10", type: "percent", value: 10 });

    expect(svc.createCoupon).toHaveBeenCalledWith(expect.objectContaining({ code: "SAVE10" }));
  });

  it("creates the coupon and returns 201", async () => {
    svc.createCoupon.mockResolvedValue({ id: 1, code: "SAVE10" } as any);

    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", adminAuth)
      .send({ code: "SAVE10", type: "percent", value: 10 });

    expect(res.status).toBe(201);
  });

  it("rejects a non-ISO expiry with 422", async () => {
    const res = await request(app)
      .post("/api/coupons")
      .set("Authorization", adminAuth)
      .send({ code: "SAVE10", type: "percent", value: 10, expiresAt: "next tuesday" });

    expect(res.status).toBe(422);
  });
});

describe("PUT /api/coupons/:id", () => {
  it("rejects a non-numeric id with 400", async () => {
    const res = await request(app)
      .put("/api/coupons/abc")
      .set("Authorization", adminAuth)
      .send({ value: 15 });

    expect(res.status).toBe(400);
    expect(svc.updateCoupon).not.toHaveBeenCalled();
  });

  it("accepts a partial update", async () => {
    svc.updateCoupon.mockResolvedValue({ id: 1, value: 15 } as any);

    const res = await request(app)
      .put("/api/coupons/1")
      .set("Authorization", adminAuth)
      .send({ value: 15 });

    expect(res.status).toBe(200);
    expect(svc.updateCoupon).toHaveBeenCalledWith(1, { value: 15 });
  });

  // ── Regression cover for the silent re-activation bug ───────────────────────
  //
  // updateCouponSchema is createCouponSchema.partial(), and `.partial()` does
  // not strip the `.default(true)` that isActive carries on the create schema.
  // Zod therefore injected `isActive: true` into every partial update, and
  // updateCoupon writes any key that isn't undefined — so an admin who
  // deactivated a coupon and later edited any other field silently switched it
  // back on. The schema now overrides isActive with a plain optional boolean.
  it("does not re-activate a disabled coupon when an unrelated field is edited", async () => {
    svc.updateCoupon.mockResolvedValue({ id: 1, value: 15 } as any);

    await request(app)
      .put("/api/coupons/1")
      .set("Authorization", adminAuth)
      .send({ value: 15 }); // isActive deliberately not sent

    const data = svc.updateCoupon.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(data).not.toHaveProperty("isActive");
  });

  it("leaves isActive alone when only the expiry is edited", async () => {
    svc.updateCoupon.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .put("/api/coupons/1")
      .set("Authorization", adminAuth)
      .send({ expiresAt: "2027-01-01T00:00:00.000Z" });

    const data = svc.updateCoupon.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(data).not.toHaveProperty("isActive");
  });

  it("still honours an explicit isActive: false", async () => {
    svc.updateCoupon.mockResolvedValue({ id: 1, isActive: false } as any);

    await request(app)
      .put("/api/coupons/1")
      .set("Authorization", adminAuth)
      .send({ isActive: false });

    expect(svc.updateCoupon).toHaveBeenCalledWith(1, { isActive: false });
  });

  it("still honours an explicit isActive: true", async () => {
    svc.updateCoupon.mockResolvedValue({ id: 1, isActive: true } as any);

    await request(app)
      .put("/api/coupons/1")
      .set("Authorization", adminAuth)
      .send({ isActive: true });

    expect(svc.updateCoupon).toHaveBeenCalledWith(1, { isActive: true });
  });

  it("still validates the fields that are present", async () => {
    const res = await request(app)
      .put("/api/coupons/1")
      .set("Authorization", adminAuth)
      .send({ value: -5 });

    expect(res.status).toBe(422);
  });
});

describe("DELETE /api/coupons/:id", () => {
  it("rejects a non-numeric id with 400", async () => {
    const res = await request(app).delete("/api/coupons/abc").set("Authorization", adminAuth);

    expect(res.status).toBe(400);
    expect(svc.deleteCoupon).not.toHaveBeenCalled();
  });

  it("deletes for an admin", async () => {
    svc.deleteCoupon.mockResolvedValue({} as any);

    const res = await request(app).delete("/api/coupons/1").set("Authorization", adminAuth);

    expect(res.status).toBe(200);
    expect(svc.deleteCoupon).toHaveBeenCalledWith(1);
  });
});

describe("POST /api/coupons/validate", () => {
  const validate = () =>
    request(app).post("/api/coupons/validate").set("X-Forwarded-For", nextIp());

  it("requires authentication, so codes cannot be probed anonymously", async () => {
    const res = await validate().send({ code: "SAVE10", orderAmount: 1000 });

    expect(res.status).toBe(401);
    expect(svc.validateCoupon).not.toHaveBeenCalled();
  });

  it("is open to any signed-in customer, not just admins", async () => {
    svc.validateCoupon.mockResolvedValue({ id: 1, code: "SAVE10", type: "percent", value: 10 } as any);

    const res = await validate()
      .set("Authorization", customerAuth)
      .send({ code: "SAVE10", orderAmount: 1000 });

    expect(res.status).toBe(200);
  });

  it("rejects a missing code with 422", async () => {
    const res = await validate().set("Authorization", customerAuth).send({ orderAmount: 1000 });

    expect(res.status).toBe(422);
  });

  it("rejects a non-positive order amount with 422", async () => {
    const res = await validate()
      .set("Authorization", customerAuth)
      .send({ code: "SAVE10", orderAmount: 0 });

    expect(res.status).toBe(422);
  });

  it("uppercases the submitted code", async () => {
    svc.validateCoupon.mockResolvedValue({ id: 1, code: "SAVE10", type: "percent", value: 10 } as any);

    await validate()
      .set("Authorization", customerAuth)
      .send({ code: "save10", orderAmount: 1000 });

    expect(svc.validateCoupon).toHaveBeenCalledWith("SAVE10", 1000);
  });

  it("answers 400 — not 500 — for an expired or unknown code", async () => {
    svc.validateCoupon.mockRejectedValue(new Error("Coupon has expired"));

    const res = await validate()
      .set("Authorization", customerAuth)
      .send({ code: "OLD10", orderAmount: 1000 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/expired/i);
  });

  it("returns only the fields checkout needs, never the usage counters", async () => {
    svc.validateCoupon.mockResolvedValue({ id: 1, code: "SAVE10", type: "percent", value: 10 } as any);

    const res = await validate()
      .set("Authorization", customerAuth)
      .send({ code: "SAVE10", orderAmount: 1000 });

    expect(Object.keys(res.body).sort()).toEqual(["code", "id", "type", "value"]);
  });

  it("cuts a single client off after 30 guesses in the window", async () => {
    svc.validateCoupon.mockRejectedValue(new Error("Coupon code not found"));
    const attacker = "192.0.2.99";

    let lastStatus = 0;
    for (let i = 0; i < 31; i++) {
      const res = await request(app)
        .post("/api/coupons/validate")
        .set("X-Forwarded-For", attacker)
        .set("Authorization", customerAuth)
        .send({ code: `GUESS${i}`, orderAmount: 1000 });
      lastStatus = res.status;
    }

    // Otherwise the whole code space could be enumerated for the best discount.
    expect(lastStatus).toBe(429);
  });
});
