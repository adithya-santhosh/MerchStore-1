"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, AlertCircle, ArrowLeft, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { resetPasswordAPI } from "@/lib/api";

import { getErrorMessage } from "@/lib/errors";
// Mirrors resetPasswordSchema on the backend — keep these in sync.
const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPasswordAPI(token, password);
      setDone(true);
      // Give the user a moment to read the confirmation before redirecting.
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to reset your password. Please try again."));
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

        {!token ? (
          /* Reached without a token — e.g. the URL was typed or truncated */
          <div className="text-center space-y-4">
            <div className="size-12 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive mx-auto">
              <AlertCircle className="size-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">Invalid Reset Link</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This link is missing its reset token. Request a fresh one and use
                the most recent email we sent you.
              </p>
            </div>
            <Button asChild className="w-full py-6 text-sm font-bold rounded-xl cursor-pointer">
              <Link href="/forgot-password">Request a New Link</Link>
            </Button>
          </div>
        ) : done ? (
          /* Success state */
          <div className="text-center space-y-4">
            <div className="size-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mx-auto">
              <CircleCheck className="size-6" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">Password Updated</h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You can now sign in with your new password. Taking you to the
                sign-in page…
              </p>
            </div>
            <Button asChild className="w-full py-6 text-sm font-bold rounded-xl cursor-pointer">
              <Link href="/login">Sign In Now</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Branding header */}
            <div className="text-center space-y-2">
              <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] mx-auto transition-transform hover:rotate-12 duration-300">
                <ShieldCheck className="size-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-4">Set A New Password</h1>
              <p className="text-xs text-muted-foreground">
                Choose a strong password you haven&apos;t used before
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

              {/* New password */}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-foreground font-bold">
                  New Password
                </label>
                <PasswordInput
                  id="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  autoComplete="new-password"
                />
                <p className="text-[10px] text-muted-foreground">
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-foreground font-bold">
                  Confirm New Password
                </label>
                <PasswordInput
                  id="confirm-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full py-6 text-sm font-bold shadow-lg shadow-primary/10 rounded-xl cursor-pointer mt-4"
              >
                {submitting ? "Updating Password..." : "Update Password"}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center pt-2 text-xs">
              <span className="text-muted-foreground">Link expired? </span>
              <Link href="/forgot-password" className="text-primary font-bold hover:underline">
                Request a new one
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
