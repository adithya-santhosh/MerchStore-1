import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/cart.service", () => ({
  getOrCreateCart: vi.fn(),
  addItemToCart: vi.fn(),
  removeItemFromCart: vi.fn(),
}));

import app from "../../src/app";
import * as cartService from "../../src/services/cart.service";

const svc = vi.mocked(cartService);
const JWT_SECRET = process.env.JWT_SECRET!;

const customerToken = jwt.sign(
  { id: 7, email: "ada@example.com", role: "CUSTOMER", firstName: "Ada", lastName: "L" },
  JWT_SECRET,
  { expiresIn: "1h" }
);

const emptyCart = { id: 1, sessionToken: "guest-tok", userId: null, items: [] };

beforeEach(() => {
  vi.clearAllMocks();
  svc.getOrCreateCart.mockResolvedValue(emptyCart as any);
  svc.addItemToCart.mockResolvedValue(emptyCart as any);
  svc.removeItemFromCart.mockResolvedValue(emptyCart as any);
});

describe("GET /api/cart", () => {
  it("serves a guest with no credentials at all", async () => {
    const res = await request(app).get("/api/cart");

    expect(res.status).toBe(200);
    expect(svc.getOrCreateCart).toHaveBeenCalledWith(undefined, undefined);
  });

  it("reads the guest session token from the x-session-token header", async () => {
    await request(app).get("/api/cart").set("x-session-token", "guest-tok");

    expect(svc.getOrCreateCart).toHaveBeenCalledWith("guest-tok", undefined);
  });

  it("accepts the session token as a query parameter too", async () => {
    await request(app).get("/api/cart?sessionToken=guest-tok");

    expect(svc.getOrCreateCart).toHaveBeenCalledWith("guest-tok", undefined);
  });

  it("prefers the header over the query parameter", async () => {
    await request(app)
      .get("/api/cart?sessionToken=from-query")
      .set("x-session-token", "from-header");

    expect(svc.getOrCreateCart).toHaveBeenCalledWith("from-header", undefined);
  });

  it("attaches the signed-in user's id when a token is present", async () => {
    await request(app).get("/api/cart").set("Authorization", `Bearer ${customerToken}`);

    expect(svc.getOrCreateCart).toHaveBeenCalledWith(undefined, 7);
  });

  it("falls back to guest behaviour on an invalid token rather than 401", async () => {
    const res = await request(app).get("/api/cart").set("Authorization", "Bearer garbage");

    // The cart is deliberately open to guests; a stale token must not lock a
    // shopper out of their own basket.
    expect(res.status).toBe(200);
    expect(svc.getOrCreateCart).toHaveBeenCalledWith(undefined, undefined);
  });

  it("answers 500 when the service fails", async () => {
    svc.getOrCreateCart.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/api/cart");

    expect(res.status).toBe(500);
  });
});

describe("POST /api/cart/items", () => {
  it("refuses when there is neither a session token nor a signed-in user", async () => {
    const res = await request(app).post("/api/cart/items").send({ productId: 10, quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/session token or user authentication/i);
  });

  it("rejects a non-numeric product id", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: "abc", quantity: 1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid product ID");
  });

  it("rejects a product id of 0", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: 0, quantity: 1 });

    expect(res.status).toBe(400);
  });

  it("rejects a negative product id", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: -5, quantity: 1 });

    expect(res.status).toBe(400);
  });

  it("rejects a quantity of 0 on the add endpoint", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: 10, quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/positive integer/i);
  });

  it("rejects a negative quantity on the add endpoint", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: 10, quantity: -3 });

    expect(res.status).toBe(400);
  });

  it("adds relative to what is already in the basket", async () => {
    await request(app)
      .post("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: 10, quantity: 2 });

    expect(svc.addItemToCart).toHaveBeenCalledWith("guest-tok", undefined, 10, 2, true);
  });

  it("coerces numeric strings from a form post", async () => {
    await request(app)
      .post("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: "10", quantity: "2" });

    expect(svc.addItemToCart).toHaveBeenCalledWith("guest-tok", undefined, 10, 2, true);
  });

  it("uses the signed-in user's cart when a token is present", async () => {
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: 10, quantity: 1 });

    expect(svc.addItemToCart).toHaveBeenCalledWith(undefined, 7, 10, 1, true);
  });

  it("surfaces an unknown product as an error rather than a silent success", async () => {
    svc.addItemToCart.mockRejectedValue(new Error("Product not found"));

    const res = await request(app)
      .post("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: 999, quantity: 1 });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Product not found");
  });
});

describe("PUT /api/cart/items", () => {
  it("sets the quantity absolutely rather than adding to it", async () => {
    await request(app)
      .put("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: 10, quantity: 3 });

    expect(svc.addItemToCart).toHaveBeenCalledWith("guest-tok", undefined, 10, 3, false);
  });

  it("accepts a quantity of 0, which removes the line", async () => {
    const res = await request(app)
      .put("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: 10, quantity: 0 });

    expect(res.status).toBe(200);
    expect(svc.addItemToCart).toHaveBeenCalledWith("guest-tok", undefined, 10, 0, false);
  });

  it("still rejects a negative quantity", async () => {
    const res = await request(app)
      .put("/api/cart/items")
      .set("x-session-token", "guest-tok")
      .send({ productId: 10, quantity: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/non-negative/i);
  });

  it("refuses without a session token or signed-in user", async () => {
    const res = await request(app).put("/api/cart/items").send({ productId: 10, quantity: 1 });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/cart/items/:productId", () => {
  it("removes the product from the guest cart", async () => {
    const res = await request(app)
      .delete("/api/cart/items/10")
      .set("x-session-token", "guest-tok");

    expect(res.status).toBe(200);
    expect(svc.removeItemFromCart).toHaveBeenCalledWith("guest-tok", undefined, 10);
  });

  it("rejects a non-numeric product id in the path", async () => {
    const res = await request(app)
      .delete("/api/cart/items/not-a-number")
      .set("x-session-token", "guest-tok");

    expect(res.status).toBe(400);
    expect(svc.removeItemFromCart).not.toHaveBeenCalled();
  });

  it("refuses without a session token or signed-in user", async () => {
    const res = await request(app).delete("/api/cart/items/10");

    expect(res.status).toBe(400);
  });

  it("scopes the removal to the signed-in user", async () => {
    await request(app)
      .delete("/api/cart/items/10")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(svc.removeItemFromCart).toHaveBeenCalledWith(undefined, 7, 10);
  });
});
