import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// checkout/page.tsx is a client component, so its metadata lives here.
// noIndex: this is a private/transactional page with no search value.
export const metadata: Metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your order securely.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
