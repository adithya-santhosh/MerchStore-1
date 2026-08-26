import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// rewards/page.tsx is a client component, so its metadata lives here.
export const metadata: Metadata = buildMetadata({
  title: "Premium Membership & Rewards",
  description:
    "Join the Premium Club for 10% off storewide, priority express processing and VIP engineering consultations. One-time lifetime membership.",
  path: "/rewards",
});

export default function RewardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
