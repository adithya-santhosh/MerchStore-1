"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Car, Wrench } from "lucide-react";
import { getNavigationMetadata, NavMetadata, NavVehicle } from "@/lib/api";
import ScrollReveal from "@/components/ScrollReveal";

export default function VehicleShowcase() {
  const [navMetadata, setNavMetadata] = useState<NavMetadata | null>(null);

  useEffect(() => {
    getNavigationMetadata()
      .then(setNavMetadata)
      .catch(() => {
        // Section simply won't render without data
      });
  }, []);

  if (!navMetadata || navMetadata.vehicles.length === 0) return null;

  const groupedByMake = navMetadata.vehicles.reduce((acc, v) => {
    if (!acc[v.make]) acc[v.make] = [];
    acc[v.make].push(v);
    return acc;
  }, {} as Record<string, NavVehicle[]>);

  return (
    <section className="w-full bg-card/20 border-y border-border/40 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10 sm:mb-14">
            <div className="space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 border border-primary/20 bg-primary/5 text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
                <Wrench className="size-3.5" />
                Fitment Verified
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold uppercase tracking-tight text-foreground">
                Built For Your Ride
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                Every part is engineered and tested against real vehicle
                platforms. Find gear designed specifically for your make and
                model.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 border border-border/40">
          {Object.entries(groupedByMake).map(([make, models], index) => (
            <ScrollReveal key={make} delay={index * 80} direction="up">
              <div className="h-full p-5 sm:p-6 bg-background hover:bg-card/60 transition-colors duration-300">
                <h3 className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground tracking-wider uppercase pb-4 mb-4 border-b border-border/50">
                  <span className="shrink-0 size-8 flex items-center justify-center text-primary border border-primary/25 bg-primary/5">
                    <Car className="size-4" />
                  </span>
                  {make}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {models.map((model) => (
                    <Link
                      key={model.id}
                      href={`/products?vehicle=${encodeURIComponent(model.model)}`}
                      className="text-xs font-semibold px-3 py-1.5 border border-border bg-muted/30 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all cursor-pointer"
                    >
                      {model.model}
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
