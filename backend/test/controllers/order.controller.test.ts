import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/order.service", () => ({
  createOrder: vi.fn(),
  getOrdersByUser: vi.fn(),
  getOrderById: vi.fn(),
  getAllOrdersAdmin: vi.fn(),
  getOrderByIdAdmin: vi.fn(),
  updateOrderStatus: vi.fn(),
  cancelOrder: vi.fn(),
  getRefundsOwed: vi.fn(),
  markPaymentRefunded: vi.fn(),
  resolveCheckoutUserId: vi.fn(),
}));

// requireAuth checks tokenVersion against the DB on every request.
vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import app from "../../src/app";
import * as orderService from "../../src/services/order.service";

const svc = vi.mocked(orderService);
const JWT_SECRET = process.env.JWT_SECRET!;

const tokenWithRole = (role: string, id = 7) =>
  jwt.sign({ id, email: "u@example.com", role, firstName: "U", lastName: "R" }, JWT_SECRET, {
    expiresIn: "1h",
  });

const customerAuth = `Bearer ${tokenWithRole("CUSTOMER")}`;
const adminAuth = `Bearer ${tokenWithRole("ADMIN")}`;

const validAddress = {
  addressLine1: "221B Baker Street",
  city: "Bengaluru",
  state: "KA",
  postalCode: "560001",
};

const validOrder = { address: validAddress, paymentMethod: "cod" };

beforeEach(() => {
  vi.clearAllMocks();
  // Matches customerAuth's id (7) by default; guest-checkout tests below
  // override this per-case.
  svc.resolveCheckoutUserId.mockResolvedValue({ userId: 7 });
});

describe("POST /api/orders", () => {
  it("requires guest contact details when placing an order while signed out", async () => {
    svc.resolveCheckoutUserId.mockRejectedValue(
      new Error("Please enter your name and email to check out as a guest.")
    );

    const res = await request(app).post("/api/orders").send(validOrder);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/guest/i);
    expect(svc.createOrder).not.toHaveBeenCalled();
  });

  it("places a guest order using the resolved guest user id, and signs them in", async () => {
    svc.resolveCheckoutUserId.mockResolvedValue({ userId: 42, resolvedGuestUser: { id: 42, email: "g@example.com", role: "CUSTOMER", firstName: "G", lastName: "T", tokenVersion: 0 } });
    svc.createOrder.mockResolvedValue({ id: 9 } as any);

    const res = await request(app)
      .post("/api/orders")
      .send({ ...validOrder, guest: { email: "g@example.com", firstName: "G", lastName: "T" } });

    expect(res.status).toBe(201);
    expect(svc.createOrder).toHaveBeenCalledWith(expect.objectContaining({ userId: 42 }));
    expect(res.headers["set-cookie"]?.some((c: string) => c.startsWith("token="))).toBe(true);
  });

  it("does not re-issue a session cookie for an already-authenticated checkout", async () => {
    svc.createOrder.mockResolvedValue({ id: 1 } as any);

    const res = await request(app).post("/api/orders").set("Authorization", customerAuth).send(validOrder);

    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("maps a guest email that already belongs to a real account to 409", async () => {
    svc.resolveCheckoutUserId.mockRejectedValue(
      new Error("An account already exists with this email. Please log in to continue.")
    );

    const res = await request(app)
      .post("/api/orders")
      .send({ ...validOrder, guest: { email: "real@example.com", firstName: "G", lastName: "T" } });

    expect(res.status).toBe(409);
  });

  it("rejects a postal code that is not 6 digits with 422", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", customerAuth)
      .send({ ...validOrder, address: { ...validAddress, postalCode: "123" } });

    expect(res.status).toBe(422);
  });

  it("rejects a missing address line with 422", async () => {
    const { addressLine1, ...incomplete } = validAddress;

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", customerAuth)
      .send({ address: incomplete, paymentMethod: "cod" });

    expect(res.status).toBe(422);
  });

  it("rejects an unsupported payment method with 422", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", customerAuth)
      .send({ ...validOrder, paymentMethod: "bitcoin" });

    expect(res.status).toBe(422);
  });

  it("places the order for the id in the token, not the body", async () => {
    svc.createOrder.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .post("/api/orders")
      .set("Authorization", customerAuth)
      .send({ ...validOrder, userId: 999 });

    expect(svc.createOrder).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
  });

  it("strips client-supplied money fields before they reach the service", async () => {
    svc.createOrder.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .post("/api/orders")
      .set("Authorization", customerAuth)
      .send({ ...validOrder, taxRate: 0, shippingCost: 0, totalAmount: 1 });

    // Zod strips unknown keys, so a client can never influence what it is charged.
    const input = svc.createOrder.mock.calls[0]?.[0] as any;
    expect(input).not.toHaveProperty("totalAmount");
    expect(input).not.toHaveProperty("taxRate");
    expect(input).not.toHaveProperty("shippingCost");
  });

  it("returns 201 with the created order", async () => {
    svc.createOrder.mockResolvedValue({ id: 1, orderNumber: "ORD-2026-00001" } as any);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", customerAuth)
      .send(validOrder);

    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toBe("ORD-2026-00001");
  });

  it("answers 400 when the cart is empty", async () => {
    svc.createOrder.mockRejectedValue(new Error("Your cart is empty."));

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", customerAuth)
      .send(validOrder);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cart is empty/i);
  });

  it("answers 400 when stock ran out mid-checkout", async () => {
    svc.createOrder.mockRejectedValue(new Error("Roof Rack no longer has enough stock."));

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", customerAuth)
      .send(validOrder);

    expect(res.status).toBe(400);
  });
});

describe("GET /api/orders", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/orders");

    expect(res.status).toBe(401);
  });

  it("lists only the caller's own orders", async () => {
    svc.getOrdersByUser.mockResolvedValue([] as any);

    await request(app).get("/api/orders").set("Authorization", customerAuth);

    expect(svc.getOrdersByUser).toHaveBeenCalledWith(7);
  });
});

describe("GET /api/orders/:id", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/orders/1");

    expect(res.status).toBe(401);
  });

  it("rejects a non-numeric id with 400", async () => {
    const res = await request(app).get("/api/orders/abc").set("Authorization", customerAuth);

    expect(res.status).toBe(400);
    expect(svc.getOrderById).not.toHaveBeenCalled();
  });

  it("scopes the fetch to the calling customer", async () => {
    svc.getOrderById.mockResolvedValue({ id: 1 } as any);

    await request(app).get("/api/orders/1").set("Authorization", customerAuth);

    expect(svc.getOrderById).toHaveBeenCalledWith(1, 7);
  });

  it("maps a missing order to 404", async () => {
    svc.getOrderById.mockRejectedValue(new Error("Order not found"));

    const res = await request(app).get("/api/orders/999").set("Authorization", customerAuth);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/orders/:id/cancel", () => {
  it("requires authentication", async () => {
    const res = await request(app).patch("/api/orders/1/cancel").send({});

    expect(res.status).toBe(401);
  });

  it("is matched before the generic /:id route", async () => {
    svc.cancelOrder.mockResolvedValue({ id: 1, status: "CANCELLED" } as any);

    const res = await request(app)
      .patch("/api/orders/1/cancel")
      .set("Authorization", customerAuth)
      .send({});

    expect(res.status).toBe(200);
    expect(svc.cancelOrder).toHaveBeenCalled();
  });

  it("passes the caller's own id so one customer cannot cancel another's order", async () => {
    svc.cancelOrder.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .patch("/api/orders/1/cancel")
      .set("Authorization", customerAuth)
      .send({ userId: 999 });

    expect(svc.cancelOrder).toHaveBeenCalledWith(1, expect.objectContaining({ userId: 7 }));
  });

  it("trims and caps a supplied cancellation reason", async () => {
    svc.cancelOrder.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .patch("/api/orders/1/cancel")
      .set("Authorization", customerAuth)
      .send({ reason: `  ${"x".repeat(600)}  ` });

    const opts = svc.cancelOrder.mock.calls[0]?.[1] as any;
    expect(opts.reason).toHaveLength(500);
  });

  it("omits the reason entirely when it is blank", async () => {
    svc.cancelOrder.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .patch("/api/orders/1/cancel")
      .set("Authorization", customerAuth)
      .send({ reason: "   " });

    expect(svc.cancelOrder).toHaveBeenCalledWith(1, { userId: 7 });
  });

  it("maps a missing order to 404 without confirming it exists", async () => {
    svc.cancelOrder.mockRejectedValue(new Error("Order not found"));

    const res = await request(app)
      .patch("/api/orders/999/cancel")
      .set("Authorization", customerAuth)
      .send({});

    expect(res.status).toBe(404);
  });

  it("answers 400 when the order has already shipped", async () => {
    svc.cancelOrder.mockRejectedValue(new Error("This order can no longer be cancelled."));

    const res = await request(app)
      .patch("/api/orders/1/cancel")
      .set("Authorization", customerAuth)
      .send({});

    expect(res.status).toBe(400);
  });

  it("rejects an invalid order id with 400", async () => {
    const res = await request(app)
      .patch("/api/orders/abc/cancel")
      .set("Authorization", customerAuth)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("admin order routes — access control", () => {
  it.each([
    ["get", "/api/orders/admin/all"],
    ["get", "/api/orders/admin/refunds-owed"],
    ["get", "/api/orders/admin/1"],
    ["patch", "/api/orders/admin/1/status"],
    ["patch", "/api/orders/admin/1/refund"],
  ])("rejects an anonymous %s %s with 401", async (method, path) => {
    const res = await (request(app) as any)[method](path);

    expect(res.status).toBe(401);
  });

  it.each([
    ["get", "/api/orders/admin/all"],
    ["get", "/api/orders/admin/refunds-owed"],
    ["get", "/api/orders/admin/1"],
    ["patch", "/api/orders/admin/1/status"],
    ["patch", "/api/orders/admin/1/refund"],
  ])("rejects a customer's %s %s with 403", async (method, path) => {
    const res = await (request(app) as any)[method](path).set("Authorization", customerAuth);

    expect(res.status).toBe(403);
  });
});

describe("GET /api/orders/admin/all", () => {
  it("forwards pagination parameters", async () => {
    svc.getAllOrdersAdmin.mockResolvedValue({ orders: [], total: 0 } as any);

    await request(app).get("/api/orders/admin/all?page=2&limit=50").set("Authorization", adminAuth);

    expect(svc.getAllOrdersAdmin).toHaveBeenCalledWith({ page: 2, limit: 50 });
  });

  it("omits pagination entirely when not supplied, letting the service default", async () => {
    svc.getAllOrdersAdmin.mockResolvedValue({ orders: [], total: 0 } as any);

    await request(app).get("/api/orders/admin/all").set("Authorization", adminAuth);

    expect(svc.getAllOrdersAdmin).toHaveBeenCalledWith({});
  });
});

describe("GET /api/orders/admin/refunds-owed", () => {
  it("is matched before /admin/:id, so it is not read as an order id", async () => {
    svc.getRefundsOwed.mockResolvedValue([] as any);

    const res = await request(app)
      .get("/api/orders/admin/refunds-owed")
      .set("Authorization", adminAuth);

    expect(res.status).toBe(200);
    expect(svc.getRefundsOwed).toHaveBeenCalled();
    expect(svc.getOrderByIdAdmin).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/orders/admin/:id/status", () => {
  it("rejects a missing status field with 400", async () => {
    const res = await request(app)
      .patch("/api/orders/admin/1/status")
      .set("Authorization", adminAuth)
      .send({});

    expect(res.status).toBe(400);
    expect(svc.updateOrderStatus).not.toHaveBeenCalled();
  });

  it("rejects an invalid order id with 400", async () => {
    const res = await request(app)
      .patch("/api/orders/admin/abc/status")
      .set("Authorization", adminAuth)
      .send({ status: "SHIPPED" });

    expect(res.status).toBe(400);
  });

  it("updates the status for an admin", async () => {
    svc.updateOrderStatus.mockResolvedValue({ id: 1, status: "SHIPPED" } as any);

    const res = await request(app)
      .patch("/api/orders/admin/1/status")
      .set("Authorization", adminAuth)
      .send({ status: "SHIPPED" });

    expect(res.status).toBe(200);
    expect(svc.updateOrderStatus).toHaveBeenCalledWith(1, "SHIPPED");
  });

  it("answers 400 for a status outside the enum", async () => {
    svc.updateOrderStatus.mockRejectedValue(new Error("Invalid status. Must be one of: PENDING"));

    const res = await request(app)
      .patch("/api/orders/admin/1/status")
      .set("Authorization", adminAuth)
      .send({ status: "TELEPORTED" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/orders/admin/:id/refund", () => {
  it("records a refund with its gateway reference", async () => {
    svc.markPaymentRefunded.mockResolvedValue({ id: 1 } as any);

    const res = await request(app)
      .patch("/api/orders/admin/1/refund")
      .set("Authorization", adminAuth)
      .send({ reference: "rfnd_abc123" });

    expect(res.status).toBe(200);
    expect(svc.markPaymentRefunded).toHaveBeenCalledWith(1, "rfnd_abc123");
  });

  it("passes undefined when no reference is given", async () => {
    svc.markPaymentRefunded.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .patch("/api/orders/admin/1/refund")
      .set("Authorization", adminAuth)
      .send({});

    expect(svc.markPaymentRefunded).toHaveBeenCalledWith(1, undefined);
  });

  it("caps an over-long reference at 100 characters", async () => {
    svc.markPaymentRefunded.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .patch("/api/orders/admin/1/refund")
      .set("Authorization", adminAuth)
      .send({ reference: "r".repeat(500) });

    expect((svc.markPaymentRefunded.mock.calls[0]?.[1] as string)).toHaveLength(100);
  });

  it("answers 400 when the payment was never captured", async () => {
    svc.markPaymentRefunded.mockRejectedValue(
      new Error("Only a captured payment can be refunded — this one is pending.")
    );

    const res = await request(app)
      .patch("/api/orders/admin/1/refund")
      .set("Authorization", adminAuth)
      .send({});

    expect(res.status).toBe(400);
  });

  it("answers 404 for an order that does not exist", async () => {
    svc.markPaymentRefunded.mockRejectedValue(new Error("Order not found"));

    const res = await request(app)
      .patch("/api/orders/admin/999/refund")
      .set("Authorization", adminAuth)
      .send({});

    expect(res.status).toBe(404);
  });
});
