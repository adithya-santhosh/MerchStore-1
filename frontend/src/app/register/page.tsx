"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Lock, Mail, Sparkles, AlertCircle, ArrowLeft, User, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [membershipFee, setMembershipFee] = useState<number>(999);
  
  React.useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
    fetch(`${API_URL}/api/settings`, { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (data && data.membership_fee) {
          setMembershipFee(data.membership_fee);
        }
      })
      .catch(err => console.error("Failed to load settings:", err));
  }, []);

  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await register(firstName, lastName, email, password, isMember);
    } catch (err: any) {
      setError(err.message || "Registration failed. Try again.");
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
          <h1 className="text-2xl font-black tracking-tight mt-4">Create Account</h1>
          <p className="text-xs text-muted-foreground">Register to save order histories and track shipments</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-muted-foreground">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="size-4.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-foreground font-bold">First Name</label>
              <div className="relative">
                <User className="absolute left-3 size-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground font-bold">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 size-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full bg-background border border-input rounded-xl pl-9 pr-3 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-foreground font-bold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-background border border-input rounded-xl px-10 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground font-semibold"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-foreground font-bold">Password</label>
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

          {/* Membership card selection option */}
          <div 
            onClick={() => setIsMember(!isMember)}
            className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-start gap-3 select-none mt-2
              ${isMember 
                ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" 
                : "bg-background/25 border-border/80 hover:border-primary/20 hover:bg-card/25"
              }`}
          >
            <div className={`mt-0.5 size-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0
              ${isMember 
                ? "border-primary bg-primary text-primary-foreground" 
                : "border-muted-foreground"
              }`}
            >
              {isMember && <CheckCircle2 className="size-3.5" />}
            </div>
            <div className="flex-grow space-y-1">
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs font-bold text-foreground">Join Premium Membership</span>
                <span className="text-[10px] font-black text-primary uppercase shrink-0">₹{membershipFee} One-Time</span>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold leading-relaxed">
                Unlock automated 10% off storewide, VIP mechanical consultations, and priority tracking.
              </p>
              <div className="pt-1.5 flex items-center gap-1">
                <Link 
                  href="/rewards" 
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()} // Prevent card toggle
                  className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                >
                  View Rewards & Benefits <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Terms and Conditions checkbox */}
          <div className="flex items-center gap-2 select-none pt-2">
            <input
              type="checkbox"
              id="terms"
              required
              className="size-4 border-input rounded text-primary focus:ring-primary cursor-pointer shrink-0"
            />
            <label htmlFor="terms" className="text-[10px] font-bold text-muted-foreground cursor-pointer hover:text-foreground">
              I agree to the Terms & Conditions and Privacy Policy
            </label>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting}
            className="w-full py-6 text-sm font-bold shadow-lg shadow-primary/10 rounded-xl cursor-pointer mt-4"
          >
            {submitting ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 text-xs">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
