"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function DashboardTimeRange() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentDays = searchParams.get("days") || "30";

  const setDays = (days: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", days);
    router.push(`${pathname}?${params.toString()}`);
  };

  const ranges = [
    { label: "7 Days", value: "7" },
    { label: "30 Days", value: "30" },
    { label: "90 Days", value: "90" },
  ];

  return (
    <div className="flex bg-muted/30 border border-border p-1 rounded-xl shadow-inner">
      {ranges.map((range) => {
        const active = currentDays === range.value;
        return (
          <button
            key={range.value}
            onClick={() => setDays(range.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
