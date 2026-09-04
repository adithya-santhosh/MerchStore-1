import prisma from "../lib/prisma";

// ─── Get approved reviews for a product ──────────────────────────────────────

export const getReviewsForProduct = async (productId: number) => {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt,
    user: {
      id: r.user.id,
      firstName: r.user.firstName,
      lastInitial: r.user.lastName ? r.user.lastName[0] + "." : "",
    },
  }));
};

// ─── Get review stats (average, breakdown) ───────────────────────────────────

export const getReviewStats = async (productId: number) => {
  const reviews = await prisma.review.findMany({
    where: { productId, isApproved: true },
    select: { rating: true },
  });

  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = Math.round((sum / totalReviews) * 10) / 10;

  const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] ?? 0) + 1;
    }
  }

  return { averageRating, totalReviews, ratingBreakdown };
};

// ─── Create a review ─────────────────────────────────────────────────────────

export const createReview = async (
  userId: number,
  productId: number,
  data: { rating: number; title?: string; body?: string }
) => {
  // Check if user already reviewed this product
  const existing = await prisma.review.findFirst({
    where: { userId, productId },
  });
  if (existing) {
    throw new Error("You have already reviewed this product");
  }

  // Validate rating
  if (data.rating < 1 || data.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  // Check if user has a delivered order containing this product (verified purchase)
  const deliveredOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: "DELIVERED",
      items: { some: { productId } },
    },
  });

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating: data.rating,
      title: data.title || null,
      body: data.body || null,
      isVerifiedPurchase: !!deliveredOrder,
      // Held back from the public listing (getReviewsForProduct filters on
      // this) until an admin approves it via the moderation queue.
      isApproved: false,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    isVerifiedPurchase: review.isVerifiedPurchase,
    isApproved: review.isApproved,
    createdAt: review.createdAt,
    user: {
      id: review.user.id,
      firstName: review.user.firstName,
      lastInitial: review.user.lastName ? review.user.lastName[0] + "." : "",
    },
  };
};

// ─── Admin moderation ─────────────────────────────────────────────────────────

/** Everything awaiting a decision, oldest first — first submitted, first reviewed. */
export const getPendingReviews = async () => {
  const reviews = await prisma.review.findMany({
    where: { isApproved: false },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    isVerifiedPurchase: r.isVerifiedPurchase,
    createdAt: r.createdAt,
    user: { id: r.user.id, name: `${r.user.firstName} ${r.user.lastName}`.trim(), email: r.user.email },
    product: { id: r.product.id, name: r.product.name, slug: r.product.slug },
  }));
};

export const approveReview = async (reviewId: number) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");

  await prisma.review.update({ where: { id: reviewId }, data: { isApproved: true } });
  return { message: "Review approved" };
};

/** Admin removal — unlike deleteReview below, not gated on ownership. Used to
 *  reject a pending review or take down one that's already live. */
export const adminDeleteReview = async (reviewId: number) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");

  await prisma.review.delete({ where: { id: reviewId } });
  return { message: "Review removed" };
};

// ─── Delete own review ───────────────────────────────────────────────────────

export const deleteReview = async (reviewId: number, userId: number) => {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Review not found");
  if (review.userId !== userId) throw new Error("You can only delete your own review");

  await prisma.review.delete({ where: { id: reviewId } });
  return { message: "Review deleted successfully" };
};

// ─── Get user's review for a specific product ────────────────────────────────

export const getUserReviewForProduct = async (userId: number, productId: number) => {
  const review = await prisma.review.findFirst({
    where: { userId, productId },
  });
  return review;
};
