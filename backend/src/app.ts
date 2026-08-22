import logger from "./lib/logger";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import settingsRoutes from "./routes/settings.routes";
import couponRoutes from "./routes/coupon.routes";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";
import customerRoutes from "./routes/customer.routes";
import analyticsRoutes from "./routes/analytics.routes";
import paymentRoutes from "./routes/payment.routes";
import reviewRoutes from "./routes/review.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import vendorRoutes from "./routes/vendor.routes";

// Express app assembly, split out from server.ts so tests can import it with
// Supertest without also binding a port (app.listen lives in server.ts only).
const app = express();

// ─── Proxy Trust ──────────────────────────────────────────────────────────────
// Render (like most PaaS hosts) terminates TLS at a proxy, so the client's real
// address arrives in the X-Forwarded-For header. Without this setting Express
// reports the *proxy's* address as req.ip for every request, which makes
// express-rate-limit bucket the entire internet into one shared counter — i.e.
// 20 auth attempts per 15 minutes across all customers combined, not per person.
//
// This is deliberately a HOP COUNT, never `true`. Trusting every hop would let a
// client spoof X-Forwarded-For and sidestep rate limiting completely.
//
// Set TRUST_PROXY_HOPS to match the real chain. Render fronts every service with
// Cloudflare (visible as `Server: cloudflare` / `cf-ray` in responses), so the
// chain there is Cloudflare -> Render router -> app and the correct value is 2.
// Too low and req.ip resolves to a rotating edge IP, scattering rate-limit
// buckets; too high and a client can forge X-Forwarded-For.
const TRUST_PROXY_HOPS = process.env.TRUST_PROXY_HOPS
  ? Number(process.env.TRUST_PROXY_HOPS)
  : process.env.NODE_ENV === "production"
    ? 1
    : 0;

if (Number.isNaN(TRUST_PROXY_HOPS) || TRUST_PROXY_HOPS < 0) {
  logger.error(
    { value: process.env.TRUST_PROXY_HOPS },
    "FATAL: TRUST_PROXY_HOPS must be a non-negative integer. Refusing to start."
  );
  process.exit(1);
}

app.set("trust proxy", TRUST_PROXY_HOPS);

// ─── Request Logging ──────────────────────────────────────────────────────────
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
app.use(helmet());

// ─── CORS (restrict to known origins and allow Vercel previews) ──────────────
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",").map((o) => o.trim())
  : [];

/** Tagged so the error handler can answer 403 rather than a generic 500. */
class CorsRejectedError extends Error {
  readonly status = 403;
  constructor(readonly origin: string) {
    super(`CORS: Origin ${origin} not allowed`);
    this.name = "CorsRejectedError";
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman in dev)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin === "http://localhost:3000" ||
        origin === "http://127.0.0.1:3000" ||
        origin.endsWith(".vercel.app"); // Auto-allow Vercel previews

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new CorsRejectedError(origin));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// ─── Rate Limiting on Auth Routes ─────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in 15 minutes." },
});

// ─── General API Rate Limit ───────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,            // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (_req, res) => {
  res.send("Backend Running");
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", apiLimiter, productRoutes);
app.use("/api/cart", apiLimiter, cartRoutes);
app.use("/api/settings", apiLimiter, settingsRoutes);
app.use("/api/coupons", apiLimiter, couponRoutes);
app.use("/api/orders", apiLimiter, orderRoutes);
app.use("/api/customers", apiLimiter, customerRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);
app.use("/api/payment", apiLimiter, paymentRoutes);
app.use("/api/reviews", apiLimiter, reviewRoutes);
app.use("/api/wishlist", apiLimiter, wishlistRoutes);
app.use("/api/vendors", apiLimiter, vendorRoutes);

// ─── 404 — nothing matched ────────────────────────────────────────────────────
// Registered after every route so it only runs when nothing else handled the
// request. Returns JSON rather than Express's default HTML page, so API clients
// get a parseable body regardless of outcome.
app.use((req, res) => {
  res.status(404).json({ message: `Not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be last, and must declare all four parameters — Express identifies error
// handlers by arity, so dropping `_next` silently turns this into normal
// middleware that never runs.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // A rejected cross-origin request is a client problem, not a server fault.
  // Without this it surfaced as a 500 and polluted the logs with fake errors.
  if (err instanceof CorsRejectedError) {
    logger.warn({ origin: err.origin }, "Blocked disallowed CORS origin");
    return res.status(403).json({ message: "Origin not allowed" });
  }

  // express.json() rejects unparseable bodies with a SyntaxError carrying `body`.
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ message: "Malformed JSON in request body" });
  }

  // Body larger than the express.json limit.
  if (typeof err === "object" && err !== null && (err as { type?: string }).type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }

  // Anything else is genuinely unexpected: log it in full, but never leak
  // internals (stack traces, driver messages) to the client.
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ message: "Internal server error" });
});

export default app;
