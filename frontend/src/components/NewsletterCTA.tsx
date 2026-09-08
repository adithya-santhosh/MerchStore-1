"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsSubmitted(true);
    setEmail("");
  };

  return (
    <section className="w-full relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/15 via-background to-primary/5" />

      {/* Decorative grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Decorative glow orbs. blur-3xl on w-96/h-96 elements is one of the
          more GPU-expensive things to keep repainting during continuous
          scroll — kept smaller and less blurred so this section doesn't
          introduce jank right where people land after a long scroll. */}
      <div className="absolute top-0 left-1/4 size-64 pointer-events-none rounded-full bg-primary/10 blur-2xl" />
      <div className="absolute bottom-0 right-1/4 size-48 pointer-events-none rounded-full bg-primary/5 blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <ScrollReveal direction="up">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary-bright uppercase">
              <Sparkles className="size-3.5" />
              EXCLUSIVE ACCESS
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
              Join The{" "}
              <span className="text-primary">Garage</span>
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto">
              Be the first to know about new drops, exclusive deals, and
              limited-edition merch. No spam — just pure automotive goodness.
            </p>

            {/* Form */}
            {isSubmitted ? (
              <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
                <CheckCircle className="size-5 text-emerald-500 shrink-0" />
                <p className="text-sm font-semibold text-emerald-400">
                  You&apos;re in! Watch your inbox for exclusive drops.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2"
              >
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="h-12 px-6 shadow-lg group cursor-pointer shrink-0"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Subscribing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Subscribe
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </Button>
              </form>
            )}

            {/* Privacy note */}
            <p className="text-[10px] text-muted-foreground/60">
              By subscribing, you agree to our privacy policy. Unsubscribe anytime.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
