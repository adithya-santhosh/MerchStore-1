import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/wishlist.service", () => ({
  getWishlist: vi.fn(),
  getWishlistIds: vi.fn(),
  addToWishlist: vi.fn(),
  removeFromWishlist: vi.fn(),
}));

// requireAuth checks tokenVersion against the DB on every request.
vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import app from "../../src/app";
import * as wishlistService from "../../src/services/wishlist.service";

const svc = vi.mocked(wishlistService);
const JWT_SECRET = process.env.JWT_SECRET!;

const tokenFor = (id: number) =>
  jwt.sign(
    { id, email: `u${id}@example.com`, role: "CUSTOMER", firstName: "U", lastName: "R" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

const auth = (id = 7) => `Bearer ${tokenFor(id)}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("wishlist authentication", () => {
  it.each([
    ["get", "/api/wishlist"],
    ["get", "/api/wishlist/ids"],
    ["post", "/api/wishlist/10"],
    ["delete", "/api/wishlist/10"],
  ])("rejects an anonymous %s %s with 401", async (method, path) => {
    const res = await (request(app) as any)[method](path);

    expect(res.status).toBe(401);
  });

  it("rejects an invalid token with 401", async () => {
    const res = await request(app).get("/api/wishlist").set("Authorization", "Bearer garbage");

    expect(res.status).toBe(401);
  });
});

describe("GET /api/wishlist", () => {
  it("returns the caller's saved items", async () => {
    svc.getWishlist.mockResolvedValue([{ id: 1, product: { id: 10 } }] as any);

    const res = await request(app).get("/api/wishlist").set("Authorization", auth());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("scopes the list to the id in the token, not a query parameter", async () => {
    svc.getWishlist.mockResolvedValue([] as any);

    await request(app).get("/api/wishlist?userId=999").set("Authorization", auth(7));

    expect(svc.getWishlist).toHaveBeenCalledWith(7);
  });

  it("answers 500 when the service fails", async () => {
    svc.getWishlist.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/api/wishlist").set("Authorization", auth());

    expect(res.status).toBe(500);
  });
});

describe("GET /api/wishlist/ids", () => {
  it("returns a bare id array for the heart-icon state", async () => {
    svc.getWishlistIds.mockResolvedValue([10, 12] as any);

    const res = await request(app).get("/api/wishlist/ids").set("Authorization", auth());

    expect(res.body).toEqual([10, 12]);
  });

  it("is not swallowed by the /:productId route", async () => {
    svc.getWishlistIds.mockResolvedValue([] as any);

    await request(app).get("/api/wishlist/ids").set("Authorization", auth());

    expect(svc.getWishlistIds).toHaveBeenCalled();
  });
});

describe("POST /api/wishlist/:productId", () => {
  it("returns 201 when the product is saved", async () => {
    svc.addToWishlist.mockResolvedValue({ id: 1, productId: 10 } as any);

    const res = await request(app).post("/api/wishlist/10").set("Authorization", auth());

    expect(res.status).toBe(201);
    expect(svc.addToWishlist).toHaveBeenCalledWith(7, 10);
  });

  it("rejects a non-numeric product id with 400", async () => {
    const res = await request(app).post("/api/wishlist/abc").set("Authorization", auth());

    expect(res.status).toBe(400);
    expect(svc.addToWishlist).not.toHaveBeenCalled();
  });

  it("rejects a product id of 0 with 400", async () => {
    const res = await request(app).post("/api/wishlist/0").set("Authorization", auth());

    expect(res.status).toBe(400);
  });

  it("maps an unknown product to 404 rather than 500", async () => {
    svc.addToWishlist.mockRejectedValue(new Error("Product not found"));

    const res = await request(app).post("/api/wishlist/999").set("Authorization", auth());

    expect(res.status).toBe(404);
  });

  it("returns 500 for an unexpected failure", async () => {
    svc.addToWishlist.mockRejectedValue(new Error("connection reset"));

    const res = await request(app).post("/api/wishlist/10").set("Authorization", auth());

    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/wishlist/:productId", () => {
  it("removes the save for the calling user", async () => {
    svc.removeFromWishlist.mockResolvedValue({ message: "Removed from wishlist" } as any);

    const res = await request(app).delete("/api/wishlist/10").set("Authorization", auth(7));

    expect(res.status).toBe(200);
    expect(svc.removeFromWishlist).toHaveBeenCalledWith(7, 10);
  });

  it("cannot be pointed at another customer's saves", async () => {
    svc.removeFromWishlist.mockResolvedValue({ message: "Removed from wishlist" } as any);

    await request(app)
      .delete("/api/wishlist/10")
      .set("Authorization", auth(7))
      .send({ userId: 999 });

    expect(svc.removeFromWishlist).toHaveBeenCalledWith(7, 10);
  });

  it("rejects an invalid product id with 400", async () => {
    const res = await request(app).delete("/api/wishlist/abc").set("Authorization", auth());

    expect(res.status).toBe(400);
  });
});
