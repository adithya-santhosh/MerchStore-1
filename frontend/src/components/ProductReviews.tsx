"use client";

import { useState, useEffect } from "react";
import { Star, ShieldCheck, Trash2, MessageSquare, AlertCircle, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getProductReviews,
  getReviewStats,
  getMyReview,
  submitReview,
  deleteReviewApi,
  Review,
  ReviewStats,
} from "@/lib/api";
import Link from "next/link";

import { getErrorMessage } from "@/lib/errors";
interface ProductReviewsProps {
  productId: number;
}

// ─── Star Rating Display ──────────────────────────────────────────────────────

function StarRating({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "lg";
}) {
  const sizeClass = size === "lg" ? "size-5" : "size-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${
            star <= rating
              ? "text-amber-400 fill-amber-400"
              : star <= Math.ceil(rating) && rating % 1 >= 0.5
              ? "text-amber-400 fill-amber-400/50"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Interactive Star Picker ──────────────────────────────────────────────────

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 cursor-pointer transition-transform hover:scale-110"
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        >
          <Star
            className={`size-7 transition-colors ${
              star <= (hover || value)
                ? "text-amber-400 fill-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-xs font-bold text-muted-foreground">
          {value}/5
        </span>
      )}
    </div>
  );
}

// ─── Rating Breakdown Bar ─────────────────────────────────────────────────────

function RatingBar({
  star,
  count,
  total,
}: {
  star: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-muted-foreground w-4 text-right">
        {star}
      </span>
      <Star className="size-3 text-amber-400 fill-amber-400" />
      <div className="flex-grow h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-muted-foreground w-6 text-right">
        {count}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(0);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        getProductReviews(productId),
        getReviewStats(productId),
      ]);
      setReviews(reviewsData);
      setStats(statsData);

      if (user) {
        const mine = await getMyReview(productId);
        setMyReview(mine);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formRating === 0) {
      setError("Please select a star rating");
      return;
    }

    setSubmitting(true);
    try {
      await submitReview(productId, {
        rating: formRating,
        title: formTitle || undefined,
        body: formBody || undefined,
      });
      setFormRating(0);
      setFormTitle("");
      setFormBody("");
      setShowForm(false);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit review"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    setDeleting(true);
    try {
      await deleteReviewApi(myReview.id);
      setMyReview(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete review:", err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-16 space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-40 bg-muted/30 rounded-2xl" />
          <div className="md:col-span-2 space-y-4">
            <div className="h-24 bg-muted/30 rounded-2xl" />
            <div className="h-24 bg-muted/30 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-16 pt-12 border-t border-border/60 space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" />
          Customer Reviews
        </h2>

        {user && !myReview && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer"
          >
            Write a Review
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* ── Rating Summary ──────────────────────────────── */}
        <div className="md:col-span-4 bg-card/40 border border-border/60 rounded-2xl p-6 space-y-5">
          {stats && stats.totalReviews > 0 ? (
            <>
              <div className="text-center space-y-2">
                <p className="text-5xl font-black text-foreground">
                  {stats.averageRating}
                </p>
                <StarRating rating={stats.averageRating} size="lg" />
                <p className="text-xs font-semibold text-muted-foreground">
                  Based on {stats.totalReviews} review
                  {stats.totalReviews !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40">
                {[5, 4, 3, 2, 1].map((star) => (
                  <RatingBar
                    key={star}
                    star={star}
                    count={stats.ratingBreakdown[star] ?? 0}
                    total={stats.totalReviews}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-2">
              <Star className="size-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-foreground">No Reviews Yet</p>
              <p className="text-xs text-muted-foreground">
                Be the first to review this product!
              </p>
            </div>
          )}
        </div>

        {/* ── Reviews List + Form ──────────────────────────── */}
        <div className="md:col-span-8 space-y-6">
          {/* User's existing review notice */}
          {myReview && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary-bright">
                    Your Review
                  </span>
                  <StarRating rating={myReview.rating} />
                </div>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1 text-[10px] font-bold text-destructive hover:text-destructive/80 transition-colors cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
              {myReview.isApproved === false && (
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-500">
                  <Clock className="size-3" />
                  Awaiting approval — only you can see this until a moderator approves it.
                </p>
              )}
              {myReview.title && (
                <p className="text-sm font-bold text-foreground">
                  {myReview.title}
                </p>
              )}
              {myReview.body && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {myReview.body}
                </p>
              )}
            </div>
          )}

          {/* Write Review Form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="p-5 rounded-2xl border border-border bg-card/40 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground">
                Write Your Review
              </h3>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Rating *
                </label>
                <StarPicker value={formRating} onChange={setFormRating} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="w-full px-4 py-3 text-sm font-medium bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  maxLength={100}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Review (optional)
                </label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Share your detailed experience with this product..."
                  rows={4}
                  className="w-full px-4 py-3 text-sm font-medium bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all resize-none"
                  maxLength={2000}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md shadow-primary/10 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  className="px-5 py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/20 border border-border rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Login prompt */}
          {!user && !showForm && (
            <div className="p-4 rounded-xl border border-border/60 bg-muted/10 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                <Link href="/login" className="text-primary-bright font-bold hover:underline">
                  Sign in
                </Link>{" "}
                to leave a review
              </p>
            </div>
          )}

          {/* Review Cards */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-5 rounded-2xl border border-border/60 bg-card/30 hover:bg-card/50 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-black">
                          {review.user.firstName[0]}
                          {review.user.lastInitial[0] || ""}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {review.user.firstName} {review.user.lastInitial}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {review.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
                          <ShieldCheck className="size-3" />
                          Verified
                        </span>
                      )}
                      <StarRating rating={review.rating} />
                    </div>
                  </div>

                  {review.title && (
                    <h4 className="text-sm font-bold text-foreground">
                      {review.title}
                    </h4>
                  )}

                  {review.body && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {review.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !showForm && (
              <div className="text-center py-8 border border-border/40 rounded-2xl bg-muted/5">
                <MessageSquare className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-foreground">
                  No reviews yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Be the first customer to share your experience!
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </section>
  );
}
