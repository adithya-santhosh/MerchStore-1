import * as Sentry from "@sentry/node";

/**
 * Error tracking. Inert until SENTRY_DSN is set — Sentry.init() with no
 * dsn disables the SDK rather than throwing, so this is safe to deploy
 * before the Sentry project exists. Called from server.ts, after
 * dotenv/config but before anything else, so the DSN is available and
 * as much of the app's module graph as possible loads after Sentry has
 * patched Node's built-ins for its automatic instrumentation.
 */
export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
