import logger from "./lib/logger";
import express from "express";
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
// client spoof X-Forwarded-For and sidestep rate limiting completely. Render is
// a single hop; raise this to 2 if you later put a CDN (e.g. Cloudflare) in
// front of it.
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
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
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

export default app;
