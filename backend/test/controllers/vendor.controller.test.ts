import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/vendor.service", () => ({
  getVendorByUserId: vi.fn(),
  getVendorOrders: vi.fn(),
  submitVendorShipment: vi.fn(),
  createVendor: vi.fn(),
  getAllVendors: vi.fn(),
  assignProductToVendor: vi.fn(),
}));

// requireAuth checks tokenVersion against the DB on every request.
vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import app from "../../src/app";
import * as vendorService from "../../src/services/vendor.service";

const svc = vi.mocked(vendorService);
const JWT_SECRET = process.env.JWT_SECRET!;

const tokenWithRole = (role: string, id = 7) =>
  jwt.sign({ id, email: "u@example.com", role, firstName: "U", lastName: "R" }, JWT_SECRET, {
    expiresIn: "1h",
  });

const vendorAuth = `Bearer ${tokenWithRole("VENDOR")}`;
const adminAuth = `Bearer ${tokenWithRole("ADMIN")}`;
const customerAuth = `Bearer ${tokenWithRole("CUSTOMER")}`;

const newVendor = {
  email: "vendor@example.com",
  password: "supersecret1",
  firstName: "Vik",
  lastName: "Rao",
  companyName: "Overland Supply Co",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/vendors/orders", () => {
  it("rejects an anonymous request with 401", async () => {
    const res = await request(app).get("/api/vendors/orders");

    expect(res.status).toBe(401);
  });

  it("rejects a plain customer with 403", async () => {
    const res = await request(app).get("/api/vendors/orders").set("Authorization", customerAuth);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/vendors only/i);
    expect(svc.getVendorByUserId).not.toHaveBeenCalled();
  });

  it("allows a vendor through", async () => {
    svc.getVendorByUserId.mockResolvedValue({ id: 3 } as any);
    svc.getVendorOrders.mockResolvedValue([] as any);

    const res = await request(app).get("/api/vendors/orders").set("Authorization", vendorAuth);

    expect(res.status).toBe(200);
  });

  it("allows an admin through as well", async () => {
    svc.getVendorByUserId.mockResolvedValue({ id: 3 } as any);
    svc.getVendorOrders.mockResolvedValue([] as any);

    const res = await request(app).get("/api/vendors/orders").set("Authorization", adminAuth);

    expect(res.status).toBe(200);
  });

  it("answers 404 when the signed-in account has no vendor profile", async () => {
    svc.getVendorByUserId.mockResolvedValue(null as any);

    const res = await request(app).get("/api/vendors/orders").set("Authorization", vendorAuth);

    expect(res.status).toBe(404);
    expect(svc.getVendorOrders).not.toHaveBeenCalled();
  });

  it("resolves the vendor from the token, not from a query parameter", async () => {
    svc.getVendorByUserId.mockResolvedValue({ id: 3 } as any);
    svc.getVendorOrders.mockResolvedValue([] as any);

    await request(app)
      .get("/api/vendors/orders?vendorId=999")
      .set("Authorization", vendorAuth);

    // Otherwise one vendor could read another vendor's order book.
    expect(svc.getVendorByUserId).toHaveBeenCalledWith(7);
    expect(svc.getVendorOrders).toHaveBeenCalledWith(3);
  });
});

describe("PATCH /api/vendors/orders/:orderId/ship", () => {
  const ship = () => request(app).patch("/api/vendors/orders/1/ship");

  it("rejects an anonymous request with 401", async () => {
    const res = await ship().send({ carrier: "Delhivery", trackingNumber: "DL1" });

    expect(res.status).toBe(401);
  });

  it("rejects a plain customer with 403", async () => {
    const res = await ship()
      .set("Authorization", customerAuth)
      .send({ carrier: "Delhivery", trackingNumber: "DL1" });

    expect(res.status).toBe(403);
  });

  it("rejects a missing carrier with 400", async () => {
    const res = await ship().set("Authorization", vendorAuth).send({ trackingNumber: "DL1" });

    expect(res.status).toBe(400);
    expect(svc.submitVendorShipment).not.toHaveBeenCalled();
  });

  it("rejects a missing tracking number with 400", async () => {
    const res = await ship().set("Authorization", vendorAuth).send({ carrier: "Delhivery" });

    expect(res.status).toBe(400);
  });

  it("rejects a non-numeric order id with 400", async () => {
    const res = await request(app)
      .patch("/api/vendors/orders/abc/ship")
      .set("Authorization", vendorAuth)
      .send({ carrier: "Delhivery", trackingNumber: "DL1" });

    expect(res.status).toBe(400);
  });

  it("answers 404 when the account has no vendor profile", async () => {
    svc.getVendorByUserId.mockResolvedValue(null as any);

    const res = await ship()
      .set("Authorization", vendorAuth)
      .send({ carrier: "Delhivery", trackingNumber: "DL1" });

    expect(res.status).toBe(404);
  });

  it("saves the shipment for a legitimate vendor", async () => {
    svc.getVendorByUserId.mockResolvedValue({ id: 3 } as any);
    svc.submitVendorShipment.mockResolvedValue({ id: 5 } as any);

    const res = await ship()
      .set("Authorization", vendorAuth)
      .send({ carrier: "Delhivery", trackingNumber: "DL1" });

    expect(res.status).toBe(200);
    expect(svc.submitVendorShipment).toHaveBeenCalledWith(3, 1, {
      carrier: "Delhivery",
      trackingNumber: "DL1",
    });
  });

  it("answers 403 when the order belongs to a different vendor", async () => {
    svc.getVendorByUserId.mockResolvedValue({ id: 3 } as any);
    svc.submitVendorShipment.mockRejectedValue(
      new Error("Order does not belong to this vendor")
    );

    const res = await ship()
      .set("Authorization", vendorAuth)
      .send({ carrier: "Delhivery", trackingNumber: "DL1" });

    expect(res.status).toBe(403);
  });
});

describe("admin vendor management", () => {
  it.each([
    ["get", "/api/vendors"],
    ["post", "/api/vendors"],
    ["patch", "/api/vendors/products/10/assign"],
  ])("rejects an anonymous %s %s with 401", async (method, path) => {
    const res = await (request(app) as any)[method](path);

    expect(res.status).toBe(401);
  });

  it.each([
    ["get", "/api/vendors"],
    ["post", "/api/vendors"],
    ["patch", "/api/vendors/products/10/assign"],
  ])("rejects a customer's %s %s with 403", async (method, path) => {
    const res = await (request(app) as any)[method](path).set("Authorization", customerAuth);

    expect(res.status).toBe(403);
  });

  it("blocks a vendor from creating other vendor accounts", async () => {
    const res = await request(app)
      .post("/api/vendors")
      .set("Authorization", vendorAuth)
      .send(newVendor);

    // requireAdmin, not requireVendor — a vendor must not mint peers.
    expect(res.status).toBe(403);
    expect(svc.createVendor).not.toHaveBeenCalled();
  });

  it("blocks a vendor from listing every vendor", async () => {
    const res = await request(app).get("/api/vendors").set("Authorization", vendorAuth);

    expect(res.status).toBe(403);
  });

  it("rejects a vendor payload missing fields with 400", async () => {
    const res = await request(app)
      .post("/api/vendors")
      .set("Authorization", adminAuth)
      .send({ email: "vendor@example.com" });

    expect(res.status).toBe(400);
    expect(svc.createVendor).not.toHaveBeenCalled();
  });

  it("creates a vendor for an admin and returns 201", async () => {
    svc.createVendor.mockResolvedValue({ id: 8, vendorId: 3 } as any);

    const res = await request(app)
      .post("/api/vendors")
      .set("Authorization", adminAuth)
      .send(newVendor);

    expect(res.status).toBe(201);
  });

  it("maps a duplicate email to 409", async () => {
    svc.createVendor.mockRejectedValue(new Error("Unique constraint failed on email"));

    const res = await request(app)
      .post("/api/vendors")
      .set("Authorization", adminAuth)
      .send(newVendor);

    expect(res.status).toBe(409);
  });

  it("never echoes the new vendor's password back", async () => {
    svc.createVendor.mockResolvedValue({ id: 8, email: newVendor.email, vendorId: 3 } as any);

    const res = await request(app)
      .post("/api/vendors")
      .set("Authorization", adminAuth)
      .send(newVendor);

    expect(JSON.stringify(res.body)).not.toContain("supersecret1");
  });

  it("forwards pagination when listing vendors", async () => {
    svc.getAllVendors.mockResolvedValue({ vendors: [], total: 0 } as any);

    await request(app).get("/api/vendors?page=2&limit=50").set("Authorization", adminAuth);

    expect(svc.getAllVendors).toHaveBeenCalledWith({ page: 2, limit: 50 });
  });

  it("assigns a product to a vendor", async () => {
    svc.assignProductToVendor.mockResolvedValue({ id: 10 } as any);

    const res = await request(app)
      .patch("/api/vendors/products/10/assign")
      .set("Authorization", adminAuth)
      .send({ vendorId: 3 });

    expect(res.status).toBe(200);
    expect(svc.assignProductToVendor).toHaveBeenCalledWith(10, 3);
  });

  it("unassigns when vendorId is omitted", async () => {
    svc.assignProductToVendor.mockResolvedValue({ id: 10 } as any);

    await request(app)
      .patch("/api/vendors/products/10/assign")
      .set("Authorization", adminAuth)
      .send({});

    expect(svc.assignProductToVendor).toHaveBeenCalledWith(10, null);
  });

  it("rejects a non-numeric product id with 400", async () => {
    const res = await request(app)
      .patch("/api/vendors/products/abc/assign")
      .set("Authorization", adminAuth)
      .send({ vendorId: 3 });

    expect(res.status).toBe(400);
    expect(svc.assignProductToVendor).not.toHaveBeenCalled();
  });
});
