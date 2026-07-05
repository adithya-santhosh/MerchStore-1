import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import settingsRoutes from "./routes/settings.routes";
import couponRoutes from "./routes/coupon.routes";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";
import customerRoutes from "./routes/customer.routes";
import analyticsRoutes from "./routes/analytics.routes";
import paymentRoutes from "./routes/payment.routes";

// ─── Env Guards ──────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:3000";

const app = express();

// ─── Security Headers (Helmet) ───────────────────────────────────────────────
app.use(helmet());

// ─── CORS (restrict to known origin) ─────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, Postman in dev)
      if (!origin) return callback(null, true);
      if (
        origin === ALLOWED_ORIGIN ||
        origin === "http://localhost:3000" ||
        origin === "http://127.0.0.1:3000"
      ) {
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} | ENV: ${process.env.NODE_ENV || "development"}`);
});
