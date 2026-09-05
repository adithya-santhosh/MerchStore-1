import type { Instrumentation } from "next";

/**
 * Server-side error tracking, wired through Next's own instrumentation
 * hooks rather than the @sentry/nextjs package: that package wraps
 * next.config.ts with a webpack/Turbopack plugin, and this project runs
 * a bleeding-edge Next version (see frontend/AGENTS.md) that plugin isn't
 * guaranteed to understand yet — a broken build is a much worse outcome
 * than a slightly more manual monitoring setup. @sentry/node has no
 * Next-specific assumptions to be wrong about.
 *
 * Inert until SENTRY_DSN is set: Sentry.init() with no dsn disables the
 * SDK rather than throwing, so this is safe to ship before the account
 * exists. Edge runtime is skipped — @sentry/node uses Node-only APIs
 * (async_hooks) for request context, and nothing in this app currently
 * runs on the edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      // Conservative default — trace sampling has a real cost, and this
      // is a starting point, not a tuned value. Raise it once there's
      // actual production volume to judge it against.
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context
) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/node");
    Sentry.captureException(err, { extra: { request, context } });
  }
};
