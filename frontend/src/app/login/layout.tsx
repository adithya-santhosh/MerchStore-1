import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

// login/page.tsx is a client component, so its metadata lives here.
// noIndex: this is a private/transactional page with no search value.
export const metadata: Metadata = buildMetadata({
  title: "Sign In",
  description: "Sign in to your account.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
