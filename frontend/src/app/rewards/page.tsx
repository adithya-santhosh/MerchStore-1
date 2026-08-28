"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Percent, 
  Gift, 
  Wrench,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

export default function RewardsPage() {
  const benefits = [
    {
      title: "Storewide 10% Discount",
      description: "Get an automatic 10% off on all accessories, modifications, keychains, and apparel. No minimum purchase required.",
      icon: Percent,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    },
    {
      title: "Priority Express Dispatch",
      description: "Your custom rigs and component orders skip the queue. Standard warehouse packing within 4 hours and express carrier handoff.",
      icon: Truck,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
    },
    {
      title: "VIP Tuning Services",
      description: "Exclusive access to scheduling consultation with our master mechanics and custom tuning specialists.",
      icon: Wrench,
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20"
    },
    {
      title: "Early Access Releases",
      description: "Unlock limited edition merch, custom engineered components, and off-road safety armor 48 hours before general release.",
      icon: Sparkles,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
    },
    {
      title: "Monthly Rig Giveaways",
      description: "Automatic entry into our monthly premium draw where one member wins full gear sets or custom carbon accessories.",
      icon: Gift,
      color: "text-pink-500 bg-pink-500/10 border-pink-500/20"
    },
    {
      title: "Elite Member Badge",
      description: "Showcase your commitment with a permanent 'Elite Member' status badge across your account reviews, forum posts, and cart pages.",
      icon: ShieldCheck,
      color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      <main className="flex-1 py-16 sm:py-24 relative overflow-hidden">
        {/* Background Mesh Glows */}
        <div className="absolute top-1/4 left-1/4 -z-10 size-96 rounded-full bg-primary/2 opacity-25 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 -z-10 size-96 rounded-full bg-primary/3 opacity-25 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          {/* Hero Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary-bright text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="size-3.5" /> MerchStore Premium Club
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Unlock Ultimate Gear Rewards
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Join the official club of off-roaders and rig builders. Earn discounts, VIP assistance, and early access benefits.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={idx}
                  className="bg-card/35 border border-border/80 rounded-3xl p-6 backdrop-blur-md transition-all hover:border-primary/25 hover:bg-card/55 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-4">
                    <div className={`size-10 rounded-2xl border flex items-center justify-center ${benefit.color}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-bold text-foreground">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground font-semibold leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ section */}
          <div className="max-w-3xl mx-auto space-y-6 pt-10 border-t border-border/50">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className="size-5 text-primary" />
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div className="bg-card/25 border border-border/60 p-5 rounded-2xl">
                <h4 className="text-sm font-bold text-foreground">How does the membership cost work?</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-semibold">
                  Membership is a one-time joining fee that grants you lifetime access to all core benefits, automatic discounts, and custom tuning schedules.
                </p>
              </div>

              <div className="bg-card/25 border border-border/60 p-5 rounded-2xl">
                <h4 className="text-sm font-bold text-foreground">Can I subscribe later if I register without it?</h4>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-semibold">
                  Yes! If you choose not to subscribe during account creation, you can activate your membership status at any time directly through your account dashboard page.
                </p>
              </div>
            </div>

            <div className="text-center pt-6">
              <Link href="/register" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-bright hover:underline">
                Create account & join today <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
