import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// dashboard/page.tsx is a client component, so its metadata lives here.
// noIndex: this is a private/transactional page with no search value.
export const metadata: Metadata = buildMetadata({
  title: "My Account",
  description: "Your orders, profile, wishlist and membership.",
  path: "/dashboard",
  noIndex: true,
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
