"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, KeyRound, AlertCircle, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAPI } from "@/lib/api";

import { getErrorMessage } from "@/lib/errors";
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await requestPasswordResetAPI(email);
      // The backend intentionally returns the same response whether or not the
      // account exists, so we show the same confirmation either way.
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Mesh Glows */}
      <div className="absolute top-10 left-10 -z-10 size-80 rounded-full bg-primary/3 opacity-25 blur-3xl" />
      <div className="absolute bottom-10 right-10 -z-10 size-96 rounded-full bg-primary/2 opacity-25 blur-3xl" />

      {/* Main card */}
      <div className="w-full max-w-md bg-card/35 backdrop-blur-md border border-border/80 rounded-[2.5rem] p-8 shadow-2xl space-y-6">

        {/* Back Link */}
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" /> Back to Sign In
        </Link>

        {sent ? (
          <>
            {/* Confirmation state */}
            <div className="text-center space-y-2">
              <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mx-auto">
                <MailCheck className="size-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-4">Check Your Email</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If an account exists for{" "}
                <span className="text-foreground font-bold">{email}</span>, we&apos;ve sent it a
                link to reset your password. The link expires in 60 minutes.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/10 p-4 text-[11px] text-muted-foreground leading-relaxed">
              Didn&apos;t get it? Check your spam folder, or{" "}
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
                className="text-primary font-bold hover:underline cursor-pointer"
              >
                try a different email address
              </button>
              .
            </div>

            <Button asChild className="w-full py-6 text-sm font-bold rounded-xl cursor-pointer">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </>
        ) : (
          <>
            {/* Branding header */}
            <div className="text-center space-y-2">
              <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] mx-auto transition-transform hover:rotate-12 duration-300">
                <KeyRound className="size-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-4">Forgot Password?</h1>
              <p className="text-xs text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset it
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-muted-foreground">
              {error && (
                <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="text-foreground font-bold">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full bg-background border border-input rounded-xl px-10 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-semibold"
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-6 text-sm font-bold shadow-lg shadow-primary/10 rounded-xl cursor-pointer mt-4"
              >
                {submitting ? "Sending Link..." : "Send Reset Link"}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center pt-2 text-xs">
              <span className="text-muted-foreground">Remembered it? </span>
              <Link href="/login" className="text-primary font-bold hover:underline">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
