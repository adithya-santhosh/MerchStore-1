import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    review: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    order: { findFirst: vi.fn() },
  },
}));

import prisma from "../../src/lib/prisma";
import {
  getReviewsForProduct,
  getReviewStats,
  createReview,
  deleteReview,
  getUserReviewForProduct,
} from "../../src/services/review.service";

const mockedPrisma = vi.mocked(prisma, true);

const reviewRow = (over: Record<string, any> = {}) => ({
  id: 1,
  rating: 5,
  title: "Excellent",
  body: "Fits perfectly.",
  isVerifiedPurchase: true,
  createdAt: new Date("2026-03-01"),
  user: { id: 7, firstName: "Ada", lastName: "Lovelace" },
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getReviewsForProduct", () => {
  it("returns only approved reviews", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([] as any);

    await getReviewsForProduct(10);

    expect(mockedPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 10, isApproved: true } })
    );
  });

  it("shows the newest review first", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([] as any);

    await getReviewsForProduct(10);

    expect(mockedPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    );
  });

  it("publishes only a last initial, never the reviewer's full surname", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([reviewRow()] as any);

    const [review] = await getReviewsForProduct(10);

    expect(review.user.firstName).toBe("Ada");
    expect(review.user.lastInitial).toBe("L.");
    expect(JSON.stringify(review)).not.toContain("Lovelace");
  });

  it("copes with a reviewer who has no surname on file", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([
      reviewRow({ user: { id: 7, firstName: "Ada", lastName: "" } }),
    ] as any);

    const [review] = await getReviewsForProduct(10);

    expect(review.user.lastInitial).toBe("");
  });

  it("never exposes the reviewer's email or account id beyond the user id", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([reviewRow()] as any);

    const [review] = await getReviewsForProduct(10);

    expect(Object.keys(review.user).sort()).toEqual(["firstName", "id", "lastInitial"]);
  });

  it("carries the verified-purchase badge through", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([
      reviewRow({ isVerifiedPurchase: false }),
    ] as any);

    const [review] = await getReviewsForProduct(10);

    expect(review.isVerifiedPurchase).toBe(false);
  });
});

describe("getReviewStats", () => {
  it("reports zeroes for a product nobody has reviewed", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([] as any);

    const stats = await getReviewStats(10);

    expect(stats).toEqual({
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  });

  it("averages to one decimal place", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([
      { rating: 5 },
      { rating: 4 },
      { rating: 4 },
    ] as any);

    const stats = await getReviewStats(10);

    expect(stats.averageRating).toBe(4.3); // 13/3 = 4.333…
  });

  it("counts each star band separately", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([
      { rating: 5 },
      { rating: 5 },
      { rating: 3 },
      { rating: 1 },
    ] as any);

    const stats = await getReviewStats(10);

    expect(stats.ratingBreakdown).toEqual({ 1: 1, 2: 0, 3: 1, 4: 0, 5: 2 });
    expect(stats.totalReviews).toBe(4);
  });

  it("leaves the breakdown untouched by an out-of-range rating", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([{ rating: 5 }, { rating: 9 }] as any);

    const stats = await getReviewStats(10);

    expect(stats.ratingBreakdown[5]).toBe(1);
    expect(Object.keys(stats.ratingBreakdown).sort()).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("counts only approved reviews toward the average", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([{ rating: 5 }] as any);

    await getReviewStats(10);

    expect(mockedPrisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { productId: 10, isApproved: true } })
    );
  });

  it("handles a perfect score without floating-point drift", async () => {
    mockedPrisma.review.findMany.mockResolvedValue([{ rating: 5 }, { rating: 5 }] as any);

    const stats = await getReviewStats(10);

    expect(stats.averageRating).toBe(5);
  });
});

describe("createReview", () => {
  it("stops a customer reviewing the same product twice", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue({ id: 1 } as any);

    await expect(createReview(7, 10, { rating: 5 })).rejects.toThrow(/already reviewed/i);
    expect(mockedPrisma.review.create).not.toHaveBeenCalled();
  });

  it("rejects a rating above 5", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);

    await expect(createReview(7, 10, { rating: 6 })).rejects.toThrow(/between 1 and 5/i);
  });

  it("rejects a rating below 1", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);

    await expect(createReview(7, 10, { rating: 0 })).rejects.toThrow(/between 1 and 5/i);
  });

  it("marks the review verified when the customer has a delivered order for it", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);
    mockedPrisma.order.findFirst.mockResolvedValue({ id: 3 } as any);
    mockedPrisma.review.create.mockResolvedValue(reviewRow() as any);

    await createReview(7, 10, { rating: 5 });

    const data = (mockedPrisma.review.create.mock.calls[0]?.[0] as any).data;
    expect(data.isVerifiedPurchase).toBe(true);
  });

  it("checks for a DELIVERED order containing that exact product", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);
    mockedPrisma.order.findFirst.mockResolvedValue(null as any);
    mockedPrisma.review.create.mockResolvedValue(reviewRow() as any);

    await createReview(7, 10, { rating: 5 });

    expect(mockedPrisma.order.findFirst).toHaveBeenCalledWith({
      where: { userId: 7, status: "DELIVERED", items: { some: { productId: 10 } } },
    });
  });

  it("leaves the badge off when there is no delivered order", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);
    mockedPrisma.order.findFirst.mockResolvedValue(null as any);
    mockedPrisma.review.create.mockResolvedValue(reviewRow({ isVerifiedPurchase: false }) as any);

    await createReview(7, 10, { rating: 5 });

    const data = (mockedPrisma.review.create.mock.calls[0]?.[0] as any).data;
    expect(data.isVerifiedPurchase).toBe(false);
  });

  it("stores an omitted title and body as null rather than undefined", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);
    mockedPrisma.order.findFirst.mockResolvedValue(null as any);
    mockedPrisma.review.create.mockResolvedValue(reviewRow() as any);

    await createReview(7, 10, { rating: 4 });

    const data = (mockedPrisma.review.create.mock.calls[0]?.[0] as any).data;
    expect(data.title).toBeNull();
    expect(data.body).toBeNull();
  });

  it("returns the new review with the same redacted user shape as the list endpoint", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);
    mockedPrisma.order.findFirst.mockResolvedValue(null as any);
    mockedPrisma.review.create.mockResolvedValue(reviewRow() as any);

    const review = await createReview(7, 10, { rating: 5 });

    expect(review.user).toEqual({ id: 7, firstName: "Ada", lastInitial: "L." });
  });

  it("accepts the boundary ratings of 1 and 5", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);
    mockedPrisma.order.findFirst.mockResolvedValue(null as any);
    mockedPrisma.review.create.mockResolvedValue(reviewRow() as any);

    await expect(createReview(7, 10, { rating: 1 })).resolves.toBeTruthy();
    await expect(createReview(7, 10, { rating: 5 })).resolves.toBeTruthy();
  });
});

describe("deleteReview", () => {
  it("reports a missing review rather than throwing something opaque", async () => {
    mockedPrisma.review.findUnique.mockResolvedValue(null as any);

    await expect(deleteReview(1, 7)).rejects.toThrow("Review not found");
  });

  it("refuses to delete someone else's review", async () => {
    mockedPrisma.review.findUnique.mockResolvedValue({ id: 1, userId: 999 } as any);

    await expect(deleteReview(1, 7)).rejects.toThrow(/only delete your own/i);
    expect(mockedPrisma.review.delete).not.toHaveBeenCalled();
  });

  it("deletes the author's own review", async () => {
    mockedPrisma.review.findUnique.mockResolvedValue({ id: 1, userId: 7 } as any);
    mockedPrisma.review.delete.mockResolvedValue({} as any);

    await deleteReview(1, 7);

    expect(mockedPrisma.review.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});

describe("getUserReviewForProduct", () => {
  it("finds the caller's own review, approved or not", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(reviewRow() as any);

    await getUserReviewForProduct(7, 10);

    // No isApproved filter: an author must still see their own pending review.
    expect(mockedPrisma.review.findFirst).toHaveBeenCalledWith({
      where: { userId: 7, productId: 10 },
    });
  });

  it("returns null when the customer has not reviewed the product", async () => {
    mockedPrisma.review.findFirst.mockResolvedValue(null as any);

    expect(await getUserReviewForProduct(7, 10)).toBeNull();
  });
});
