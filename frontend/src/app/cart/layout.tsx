import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// cart/page.tsx is a client component, so its metadata lives here.
// noIndex: this is a private/transactional page with no search value.
export const metadata: Metadata = buildMetadata({
  title: "Your Cart",
  description: "Review the items in your cart before checkout.",
  path: "/cart",
  noIndex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
