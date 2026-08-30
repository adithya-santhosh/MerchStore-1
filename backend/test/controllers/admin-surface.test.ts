import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/analytics.service", () => ({
  getDashboardStats: vi.fn(),
  getRevenueChart: vi.fn(),
  getTopProducts: vi.fn(),
  getRecentOrders: vi.fn(),
  getOrderStatusBreakdown: vi.fn(),
}));

vi.mock("../../src/services/customer.service", () => ({
  getAllCustomers: vi.fn(),
  getCustomerById: vi.fn(),
  getCustomerStats: vi.fn(),
}));

vi.mock("../../src/services/settings.service", () => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
}));

vi.mock("../../src/services/payment.service", () => ({
  createRazorpayOrder: vi.fn(),
  verifyRazorpayPayment: vi.fn(),
  createMembershipRazorpayOrder: vi.fn(),
  verifyMembershipPayment: vi.fn(),
}));

// requireAuth checks tokenVersion against the DB on every request.
vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import app from "../../src/app";
import * as analyticsService from "../../src/services/analytics.service";
import * as customerService from "../../src/services/customer.service";
import * as settingsService from "../../src/services/settings.service";
import * as paymentService from "../../src/services/payment.service";

const analytics = vi.mocked(analyticsService);
const customers = vi.mocked(customerService);
const settings = vi.mocked(settingsService);
const payments = vi.mocked(paymentService);

const JWT_SECRET = process.env.JWT_SECRET!;
const tokenWithRole = (role: string, id = 7) =>
  jwt.sign({ id, email: "u@example.com", role, firstName: "U", lastName: "R" }, JWT_SECRET, {
    expiresIn: "1h",
  });

const adminAuth = `Bearer ${tokenWithRole("ADMIN")}`;
const customerAuth = `Bearer ${tokenWithRole("CUSTOMER")}`;
const vendorAuth = `Bearer ${tokenWithRole("VENDOR")}`;

const storeSettings = {
  tax_rate: 0,
  shipping_limit: 0,
  shipping_cost: 0,
  membership_fee: 999,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── One place that asserts the whole admin perimeter ─────────────────────────

const ADMIN_ONLY: [string, string][] = [
  ["get", "/api/analytics/dashboard"],
  ["get", "/api/customers/admin"],
  ["get", "/api/customers/admin/stats"],
  ["get", "/api/customers/admin/1"],
  ["put", "/api/settings"],
];

describe("admin perimeter", () => {
  it.each(ADMIN_ONLY)("rejects an anonymous %s %s with 401", async (method, path) => {
    const res = await (request(app) as any)[method](path);

    expect(res.status).toBe(401);
  });

  it.each(ADMIN_ONLY)("rejects a customer's %s %s with 403", async (method, path) => {
    const res = await (request(app) as any)[method](path).set("Authorization", customerAuth);

    expect(res.status).toBe(403);
  });

  it.each(ADMIN_ONLY)("rejects a vendor's %s %s with 403", async (method, path) => {
    const res = await (request(app) as any)[method](path).set("Authorization", vendorAuth);

    // VENDOR is not a partial admin — it must not reach the back office.
    expect(res.status).toBe(403);
  });
});

// ─── Analytics ────────────────────────────────────────────────────────────────

describe("GET /api/analytics/dashboard", () => {
  const stubAll = () => {
    analytics.getDashboardStats.mockResolvedValue({ totalRevenue: 0 } as any);
    analytics.getRevenueChart.mockResolvedValue([] as any);
    analytics.getTopProducts.mockResolvedValue([] as any);
    analytics.getRecentOrders.mockResolvedValue([] as any);
    analytics.getOrderStatusBreakdown.mockResolvedValue({} as any);
  };

  it("returns the five dashboard sections in one response", async () => {
    stubAll();

    const res = await request(app)
      .get("/api/analytics/dashboard")
      .set("Authorization", adminAuth);

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual([
      "recentOrders",
      "revenueChart",
      "stats",
      "statusBreakdown",
      "topProducts",
    ]);
  });

  it("passes no window when days is absent, so figures cover all time", async () => {
    stubAll();

    await request(app).get("/api/analytics/dashboard").set("Authorization", adminAuth);

    expect(analytics.getDashboardStats).toHaveBeenCalledWith(undefined);
  });

  it("defaults the revenue chart to 30 days even with no window", async () => {
    stubAll();

    await request(app).get("/api/analytics/dashboard").set("Authorization", adminAuth);

    expect(analytics.getRevenueChart).toHaveBeenCalledWith(30);
  });

  it("applies the requested window to every section", async () => {
    stubAll();

    await request(app).get("/api/analytics/dashboard?days=7").set("Authorization", adminAuth);

    expect(analytics.getDashboardStats).toHaveBeenCalledWith(7);
    expect(analytics.getRevenueChart).toHaveBeenCalledWith(7);
    expect(analytics.getTopProducts).toHaveBeenCalledWith(5, 7);
    expect(analytics.getOrderStatusBreakdown).toHaveBeenCalledWith(7);
  });

  it("answers 500 without leaking the underlying error", async () => {
    analytics.getDashboardStats.mockRejectedValue(new Error('relation "orders" does not exist'));
    analytics.getRevenueChart.mockResolvedValue([] as any);
    analytics.getTopProducts.mockResolvedValue([] as any);
    analytics.getRecentOrders.mockResolvedValue([] as any);
    analytics.getOrderStatusBreakdown.mockResolvedValue({} as any);

    const res = await request(app)
      .get("/api/analytics/dashboard")
      .set("Authorization", adminAuth);

    expect(res.status).toBe(500);
    expect(res.body.message).not.toMatch(/relation/);
  });
});

// ─── Customers ────────────────────────────────────────────────────────────────

describe("customer admin endpoints", () => {
  it("forwards search, sort and pagination", async () => {
    customers.getAllCustomers.mockResolvedValue({ customers: [], total: 0 } as any);

    await request(app)
      .get("/api/customers/admin?page=2&limit=25&search=ada&sortBy=totalSpent&sortOrder=desc")
      .set("Authorization", adminAuth);

    expect(customers.getAllCustomers).toHaveBeenCalledWith({
      page: 2,
      limit: 25,
      search: "ada",
      sortBy: "totalSpent",
      sortOrder: "desc",
    });
  });

  it("falls back to page 1 and 15 rows for junk pagination values", async () => {
    customers.getAllCustomers.mockResolvedValue({ customers: [], total: 0 } as any);

    await request(app)
      .get("/api/customers/admin?page=abc&limit=xyz")
      .set("Authorization", adminAuth);

    expect(customers.getAllCustomers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 15 })
    );
  });

  it("answers 404 for a customer id that does not exist", async () => {
    customers.getCustomerById.mockResolvedValue(null as any);

    const res = await request(app)
      .get("/api/customers/admin/999")
      .set("Authorization", adminAuth);

    expect(res.status).toBe(404);
  });

  it("rejects a non-numeric customer id with 400", async () => {
    const res = await request(app)
      .get("/api/customers/admin/abc")
      .set("Authorization", adminAuth);

    expect(res.status).toBe(400);
    expect(customers.getCustomerById).not.toHaveBeenCalled();
  });

  it("routes /admin/stats to the stats handler, not the id handler", async () => {
    customers.getCustomerStats.mockResolvedValue({ totalCustomers: 0 } as any);

    const res = await request(app)
      .get("/api/customers/admin/stats")
      .set("Authorization", adminAuth);

    expect(res.status).toBe(200);
    expect(customers.getCustomerStats).toHaveBeenCalled();
    expect(customers.getCustomerById).not.toHaveBeenCalled();
  });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

describe("settings endpoints", () => {
  it("serves the store settings publicly, since checkout needs them", async () => {
    settings.getSettings.mockResolvedValue(storeSettings as any);

    const res = await request(app).get("/api/settings");

    expect(res.status).toBe(200);
    expect(res.body.membership_fee).toBe(999);
  });

  it("requires an admin to change them", async () => {
    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", customerAuth)
      .send({ tax_rate: 0 });

    expect(res.status).toBe(403);
    expect(settings.updateSettings).not.toHaveBeenCalled();
  });

  it("lets an admin update them", async () => {
    settings.updateSettings.mockResolvedValue({ ...storeSettings, tax_rate: 0.18 } as any);

    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", adminAuth)
      .send({ tax_rate: 0.18 });

    expect(res.status).toBe(200);
    expect(settings.updateSettings).toHaveBeenCalledWith({ tax_rate: 0.18 });
  });

  it("answers 500 when the write fails", async () => {
    settings.updateSettings.mockRejectedValue(new Error("db down"));

    const res = await request(app)
      .put("/api/settings")
      .set("Authorization", adminAuth)
      .send({ tax_rate: 0.18 });

    expect(res.status).toBe(500);
  });
});

// ─── Payment endpoints ────────────────────────────────────────────────────────

describe("payment endpoints", () => {
  const address = {
    addressLine1: "221B Baker Street",
    city: "Bengaluru",
    state: "KA",
    postalCode: "560001",
  };

  it.each([
    "/api/payment/create-order",
    "/api/payment/verify",
    "/api/payment/create-membership-order",
    "/api/payment/verify-membership",
  ])("requires authentication for %s", async (path) => {
    const res = await request(app).post(path).send({});

    expect(res.status).toBe(401);
  });

  it("creates a gateway order for the id in the token", async () => {
    payments.createRazorpayOrder.mockResolvedValue({ orderId: "order_xyz" } as any);

    await request(app)
      .post("/api/payment/create-order")
      .set("Authorization", customerAuth)
      .send({ address, userId: 999 });

    expect(payments.createRazorpayOrder).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 7, paymentMethod: "razorpay" })
    );
  });

  it("rejects a verification missing its gateway parameters with 400", async () => {
    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", customerAuth)
      .send({ address });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing razorpay payment parameters/i);
    expect(payments.verifyRazorpayPayment).not.toHaveBeenCalled();
  });

  it("rejects a verification missing only the signature", async () => {
    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", customerAuth)
      .send({ address, razorpayOrderId: "order_xyz", razorpayPaymentId: "pay_abc" });

    expect(res.status).toBe(400);
    expect(payments.verifyRazorpayPayment).not.toHaveBeenCalled();
  });

  it("answers 400 when the signature does not verify", async () => {
    payments.verifyRazorpayPayment.mockRejectedValue(
      new Error("Payment signature verification failed. The transaction might be invalid.")
    );

    const res = await request(app)
      .post("/api/payment/verify")
      .set("Authorization", customerAuth)
      .send({
        address,
        razorpayOrderId: "order_xyz",
        razorpayPaymentId: "pay_abc",
        razorpaySignature: "forged",
      });

    expect(res.status).toBe(400);
  });

  it("omits the stack trace outside development", async () => {
    payments.createRazorpayOrder.mockRejectedValue(new Error("boom"));

    const res = await request(app)
      .post("/api/payment/create-order")
      .set("Authorization", customerAuth)
      .send({ address });

    expect(res.status).toBe(400);
    expect(res.body.stack).toBeUndefined();
  });

  it("rejects a membership verification missing its parameters with 400", async () => {
    const res = await request(app)
      .post("/api/payment/verify-membership")
      .set("Authorization", customerAuth)
      .send({ razorpayOrderId: "order_mem" });

    expect(res.status).toBe(400);
    expect(payments.verifyMembershipPayment).not.toHaveBeenCalled();
  });

  it("grants membership for the token's user, not a body-supplied id", async () => {
    payments.verifyMembershipPayment.mockResolvedValue({ id: 7, isMember: true } as any);

    await request(app)
      .post("/api/payment/verify-membership")
      .set("Authorization", customerAuth)
      .send({
        userId: 999,
        razorpayOrderId: "order_mem",
        razorpayPaymentId: "pay_mem",
        razorpaySignature: "sig",
      });

    expect(payments.verifyMembershipPayment).toHaveBeenCalledWith(
      7,
      "order_mem",
      "pay_mem",
      "sig"
    );
  });

  it("answers 400 when the customer is already a member", async () => {
    payments.createMembershipRazorpayOrder.mockRejectedValue(
      new Error("You are already a premium member.")
    );

    const res = await request(app)
      .post("/api/payment/create-membership-order")
      .set("Authorization", customerAuth)
      .send({});

    expect(res.status).toBe(400);
  });
});
