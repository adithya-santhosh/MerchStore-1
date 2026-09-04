import type { NextConfig } from "next";

// Resolved at build time from the same env var the client already uses,
// so this adapts to whatever backend origin is actually configured
// instead of a hardcoded value going stale.
const apiOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
    ).origin;
  } catch {
    return "";
  }
})();

// No nonces here deliberately: nonce-based CSP requires every page to be
// dynamically rendered (see Next's CSP guide), which would undo the static
// optimization / CDN caching this app relies on for performance — the
// exact thing this pass is trying to improve. 'unsafe-inline' is the
// pragmatic tradeoff given how much this codebase relies on inline
// style={{}} (Motion values, animationDelay, etc.); it still blocks
// loading arbitrary external scripts/frames, which is the bulk of CSP's
// real-world XSS value.
//
// Scoped to what the app actually calls out to: Razorpay (checkout
// script + payment iframe, multiple subdomains), Cloudinary (image CDN +
// signed upload endpoint), Unsplash (a fallback product image), Vercel's
// Analytics/Speed Insights beacon script, and the backend API origin.
// The Vercel one isn't obvious from reading the source — @vercel/analytics
// and @vercel/speed-insights look like they'd only ever hit first-party
// /_vercel/* paths, but they also load va.vercel-scripts.com client-side;
// this was only caught by actually loading the page against the policy
// and watching the console, not by inspecting the imports.
//
// require-trusted-types-for is intentionally left out — enabling it blind
// risks breaking Radix/Motion internals that aren't audited for Trusted
// Types compatibility.
const isDev = process.env.NODE_ENV === "development";
const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://va.vercel-scripts.com${
    isDev ? " 'unsafe-eval'" : ""
  }`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https://res.cloudinary.com https://images.unsplash.com https://*.razorpay.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://api.cloudinary.com https://*.razorpay.com${
    apiOrigin ? ` ${apiOrigin}` : ""
  }`,
  `frame-src https://*.razorpay.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'self'`,
  `upgrade-insecure-requests`,
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspDirectives },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // allow-popups rather than a strict same-origin: Razorpay's
          // checkout can use popup flows for some payment methods, and
          // strict same-origin can sever the window.opener relationship
          // those rely on.
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          // includeSubDomains only — not preload. Preload is a one-way
          // door (submission to browsers' built-in HSTS list, slow and
          // hard to reverse); that's a call for whoever owns the domain
          // to make deliberately, not something to opt into as a
          // side effect of a headers change.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
