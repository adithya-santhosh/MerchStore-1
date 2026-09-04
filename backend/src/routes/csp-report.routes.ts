import express, { Router } from "express";
import logger from "../lib/logger";
import { Sentry } from "../lib/sentry";

const router = Router();

/**
 * Receives Content-Security-Policy violation reports from the browser
 * (both the legacy `report-uri` format and the newer Reporting API
 * `report-to` format the frontend's CSP sets — see frontend/next.config.ts).
 * Browsers send these with a report-specific Content-Type that the app's
 * global express.json() doesn't parse, so this route gets its own parser
 * scoped to exactly the content types a violation report actually arrives
 * as, rather than widening the global JSON parser to match anything named
 * "json".
 *
 * No CSRF check: the browser sends these itself when a policy is
 * violated, not in response to a page's own fetch call, so there's no
 * token to attach. The handler only logs — it doesn't touch anything a
 * forged report could turn into real damage.
 */
router.post(
  "/",
  express.json({
    type: ["application/csp-report", "application/reports+json", "application/json"],
  }),
  (req, res) => {
    logger.warn({ cspReport: req.body }, "CSP violation reported");
    Sentry.captureMessage("CSP violation", {
      level: "warning",
      extra: { report: req.body },
    });
    res.status(204).end();
  }
);

export default router;
