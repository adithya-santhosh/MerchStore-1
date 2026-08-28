import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/review.service", () => ({
  getReviewsForProduct: vi.fn(),
  getReviewStats: vi.fn(),
  createReview: vi.fn(),
  deleteReview: vi.fn(),
  getUserReviewForProduct: vi.fn(),
}));

import app from "../../src/app";
import * as reviewService from "../../src/services/review.service";

const svc = vi.mocked(reviewService);
const JWT_SECRET = process.env.JWT_SECRET!;

const auth = (id = 7) =>
  `Bearer ${jwt.sign(
    { id, email: "u@example.com", role: "CUSTOMER", firstName: "U", lastName: "R" },
    JWT_SECRET,
    { expiresIn: "1h" }
  )}`;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/reviews/:productId", () => {
  it("is public — shoppers read reviews before signing in", async () => {
    svc.getReviewsForProduct.mockResolvedValue([] as any);

    const res = await request(app).get("/api/reviews/10");

    expect(res.status).toBe(200);
    expect(svc.getReviewsForProduct).toHaveBeenCalledWith(10);
  });

  it("rejects a non-numeric product id with 400", async () => {
    const res = await request(app).get("/api/reviews/abc");

    expect(res.status).toBe(400);
    expect(svc.getReviewsForProduct).not.toHaveBeenCalled();
  });

  it("rejects a product id of 0 with 400", async () => {
    const res = await request(app).get("/api/reviews/0");

    expect(res.status).toBe(400);
  });

  it("answers 500 when the query fails", async () => {
    svc.getReviewsForProduct.mockRejectedValue(new Error("db down"));

    const res = await request(app).get("/api/reviews/10");

    expect(res.status).toBe(500);
  });
});

describe("GET /api/reviews/:productId/stats", () => {
  it("is public", async () => {
    svc.getReviewStats.mockResolvedValue({
      averageRating: 4.5,
      totalReviews: 2,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
    } as any);

    const res = await request(app).get("/api/reviews/10/stats");

    expect(res.status).toBe(200);
    expect(res.body.averageRating).toBe(4.5);
  });

  it("is matched before the bare /:productId route", async () => {
    svc.getReviewStats.mockResolvedValue({ averageRating: 0, totalReviews: 0 } as any);

    await request(app).get("/api/reviews/10/stats");

    expect(svc.getReviewStats).toHaveBeenCalled();
    expect(svc.getReviewsForProduct).not.toHaveBeenCalled();
  });

  it("rejects an invalid product id with 400", async () => {
    const res = await request(app).get("/api/reviews/abc/stats");

    expect(res.status).toBe(400);
  });
});

describe("GET /api/reviews/:productId/mine", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/reviews/10/mine");

    expect(res.status).toBe(401);
    expect(svc.getUserReviewForProduct).not.toHaveBeenCalled();
  });

  it("looks up the review for the id in the token", async () => {
    svc.getUserReviewForProduct.mockResolvedValue(null as any);

    await request(app).get("/api/reviews/10/mine").set("Authorization", auth(7));

    expect(svc.getUserReviewForProduct).toHaveBeenCalledWith(7, 10);
  });

  it("returns null — not 404 — when the customer has not reviewed it", async () => {
    svc.getUserReviewForProduct.mockResolvedValue(null as any);

    const res = await request(app).get("/api/reviews/10/mine").set("Authorization", auth());

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe("POST /api/reviews/:productId", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/reviews/10").send({ rating: 5 });

    expect(res.status).toBe(401);
    expect(svc.createReview).not.toHaveBeenCalled();
  });

  it("rejects a missing rating with 400", async () => {
    const res = await request(app)
      .post("/api/reviews/10")
      .set("Authorization", auth())
      .send({ body: "Great" });

    expect(res.status).toBe(400);
    expect(svc.createReview).not.toHaveBeenCalled();
  });

  it("rejects a rating above 5 with 400", async () => {
    const res = await request(app)
      .post("/api/reviews/10")
      .set("Authorization", auth())
      .send({ rating: 6 });

    expect(res.status).toBe(400);
  });

  it("rejects a rating of 0 with 400", async () => {
    const res = await request(app)
      .post("/api/reviews/10")
      .set("Authorization", auth())
      .send({ rating: 0 });

    expect(res.status).toBe(400);
  });

  it("creates the review and returns 201", async () => {
    svc.createReview.mockResolvedValue({ id: 1, rating: 5 } as any);

    const res = await request(app)
      .post("/api/reviews/10")
      .set("Authorization", auth())
      .send({ rating: 5, title: "Excellent", body: "Fits perfectly." });

    expect(res.status).toBe(201);
    expect(svc.createReview).toHaveBeenCalledWith(7, 10, {
      rating: 5,
      title: "Excellent",
      body: "Fits perfectly.",
    });
  });

  it("attributes the review to the token's user, not a body field", async () => {
    svc.createReview.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .post("/api/reviews/10")
      .set("Authorization", auth(7))
      .send({ rating: 5, userId: 999 });

    expect(svc.createReview).toHaveBeenCalledWith(7, 10, expect.anything());
  });

  it("ignores a client-supplied verified-purchase badge", async () => {
    svc.createReview.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .post("/api/reviews/10")
      .set("Authorization", auth())
      .send({ rating: 5, isVerifiedPurchase: true });

    // The badge is earned from a delivered order, never asserted by the client.
    const data = svc.createReview.mock.calls[0]?.[2] as any;
    expect(data).not.toHaveProperty("isVerifiedPurchase");
  });

  it("maps a duplicate review to 409", async () => {
    svc.createReview.mockRejectedValue(new Error("You have already reviewed this product"));

    const res = await request(app)
      .post("/api/reviews/10")
      .set("Authorization", auth())
      .send({ rating: 5 });

    expect(res.status).toBe(409);
  });

  it("returns 500 for an unexpected failure", async () => {
    svc.createReview.mockRejectedValue(new Error("connection reset"));

    const res = await request(app)
      .post("/api/reviews/10")
      .set("Authorization", auth())
      .send({ rating: 5 });

    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/reviews/:reviewId", () => {
  it("requires authentication", async () => {
    const res = await request(app).delete("/api/reviews/1");

    expect(res.status).toBe(401);
  });

  it("deletes the caller's own review", async () => {
    svc.deleteReview.mockResolvedValue({ message: "Review deleted successfully" } as any);

    const res = await request(app).delete("/api/reviews/1").set("Authorization", auth(7));

    expect(res.status).toBe(200);
    expect(svc.deleteReview).toHaveBeenCalledWith(1, 7);
  });

  it("maps a missing review to 404", async () => {
    svc.deleteReview.mockRejectedValue(new Error("Review not found"));

    const res = await request(app).delete("/api/reviews/999").set("Authorization", auth());

    expect(res.status).toBe(404);
  });

  it("maps deleting someone else's review to 403", async () => {
    svc.deleteReview.mockRejectedValue(new Error("You can only delete your own review"));

    const res = await request(app).delete("/api/reviews/1").set("Authorization", auth());

    expect(res.status).toBe(403);
  });

  it("rejects an invalid review id with 400", async () => {
    const res = await request(app).delete("/api/reviews/abc").set("Authorization", auth());

    expect(res.status).toBe(400);
    expect(svc.deleteReview).not.toHaveBeenCalled();
  });
});
