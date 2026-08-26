import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// register/page.tsx is a client component, so its metadata lives here.
// noIndex: this is a private/transactional page with no search value.
export const metadata: Metadata = buildMetadata({
  title: "Create Account",
  description: "Create an account to track orders and save your wishlist.",
  path: "/register",
  noIndex: true,
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
