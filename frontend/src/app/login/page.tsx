"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { Lock, Mail, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password, callbackUrl);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
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
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-3.5" /> Back to Store
        </Link>

        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] mx-auto transition-transform hover:rotate-12 duration-300">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-4">Welcome Back</h1>
          <p className="text-xs text-muted-foreground">Sign in to manage your configuration and profile</p>
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
            <label className="text-foreground font-bold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-input rounded-xl px-10 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-semibold"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-foreground font-bold">Password</label>
              <span className="text-[10px] text-muted-foreground hover:text-primary cursor-pointer">Forgot password?</span>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 text-xs">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/register" className="text-primary font-bold hover:underline">
            Register now
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="text-sm text-muted-foreground animate-pulse">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
