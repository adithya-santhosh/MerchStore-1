import * as Sentry from "@sentry/browser";

/**
 * Client-side error tracking. See instrumentation.ts for why this uses
 * @sentry/browser directly instead of @sentry/nextjs.
 *
 * Inert until NEXT_PUBLIC_SENTRY_DSN is set — Sentry.init() with no dsn
 * disables the SDK rather than throwing. No manual window.onerror /
 * unhandledrejection listeners here: the SDK's default GlobalHandlers
 * integration already installs those, adding our own would just double
 * up every uncaught error.
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

export function onRouterTransitionStart(url: string) {
  Sentry.addBreadcrumb({
    category: "navigation",
    message: `Navigated to ${url}`,
    level: "info",
  });
}
