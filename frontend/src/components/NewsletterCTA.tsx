"use client";

import { useState, useRef } from "react";
import { Mail, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScrollReveal from "@/components/ScrollReveal";

// Simple confetti-like particle burst
function SuccessParticles() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    angle: (i / 12) * 360,
    distance: 40 + Math.random() * 30,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 200,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            background:
              p.id % 3 === 0
                ? "oklch(0.63 0.25 24)"
                : p.id % 3 === 1
                ? "oklch(0.7 0.2 30)"
                : "oklch(0.55 0.28 20)",
            animation: `particle-drift 1s ease-out ${p.delay}ms forwards`,
            transform: `rotate(${p.angle}deg) translateY(-${p.distance}px)`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsSubmitted(true);
    setEmail("");
  };

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background image — light trails */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/backgrounds/newsletter_bg.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Dark overlay so text is readable */}
      <div className="absolute inset-0 bg-background/75" />

      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />

      {/* Decorative glow orbs */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-primary/10 rounded-full blur-[100px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[80px] animate-float pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <ScrollReveal direction="up" scale>
          {/* Glassmorphic card */}
          <div className="max-w-2xl mx-auto glass-card rounded-3xl p-8 sm:p-12 border-primary/10 shadow-2xl shadow-primary/5">
            <div className="text-center space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary uppercase">
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
                limited-edition merch. No spam — just pure automotive
                goodness.
              </p>

              {/* Form */}
              {isSubmitted ? (
                <div className="relative">
                  <SuccessParticles />
                  <div className="flex items-center justify-center gap-3 py-4 px-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 mx-auto max-w-md animate-slide-up">
                    <CheckCircle className="size-5 text-emerald-500 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-400">
                      You&apos;re in! Watch your inbox for exclusive drops.
                    </p>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2"
                >
                  <div className="relative flex-1">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder="Enter your email"
                      required
                      className="w-full h-12 pl-10 pr-4 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-300"
                      style={{
                        borderColor: isFocused
                          ? "oklch(0.63 0.25 24)"
                          : "oklch(0.28 0.01 250)",
                        background: "rgba(255,255,255,0.03)",
                        boxShadow: isFocused
                          ? "0 0 0 3px rgba(220, 50, 47, 0.15)"
                          : "none",
                      }}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="h-12 px-6 shadow-lg shadow-primary/20 group cursor-pointer shrink-0 animate-pulse-glow"
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
              <p className="text-[10px] text-muted-foreground/50">
                By subscribing, you agree to our privacy policy. Unsubscribe
                anytime.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
