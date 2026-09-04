"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Check, X, ShieldCheck, MessageSquareText, ExternalLink } from "lucide-react";
import {
  getPendingReviewsApi,
  approveReviewApi,
  adminDeleteReviewApi,
  PendingReview,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-3.5 ${
            star <= rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Tracks which review id currently has an approve/reject request in
  // flight, so only that row's buttons disable rather than the whole list.
  const [actingOn, setActingOn] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getPendingReviewsApi();
      setReviews(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load pending reviews"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: number) => {
    setActingOn(id);
    try {
      await approveReviewApi(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to approve review"));
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (id: number) => {
    setActingOn(id);
    try {
      await adminDeleteReviewApi(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reject review"));
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Review Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          New reviews wait here before they appear on a product page. Approve
          the ones that are genuine, reject the rest.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-28 bg-muted/30 rounded-2xl" />
          <div className="h-28 bg-muted/30 rounded-2xl" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-card/40 border border-border/85 rounded-2xl p-6 space-y-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-sm">{review.user.name}</span>
                    <span className="text-xs text-muted-foreground">{review.user.email}</span>
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
                        <ShieldCheck className="size-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/products/${review.product.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-primary-bright hover:underline"
                  >
                    {review.product.name}
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} />
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {review.title && <p className="text-sm font-bold text-foreground">{review.title}</p>}
              {review.body && (
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {review.body}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleApprove(review.id)}
                  disabled={actingOn === review.id}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="size-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(review.id)}
                  disabled={actingOn === review.id}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-destructive bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="size-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-border/80 rounded-3xl bg-card/20 max-w-md mx-auto space-y-4">
          <div className="size-12 rounded-2xl bg-muted border border-border flex items-center justify-center text-muted-foreground/40 mx-auto">
            <MessageSquareText className="size-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">All Caught Up</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
              No reviews are waiting for moderation right now.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
