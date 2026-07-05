"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const settings_routes_1 = __importDefault(require("./routes/settings.routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
// ─── Env Guards ──────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET is not set. Refusing to start.");
    process.exit(1);
}
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:3000";
const app = (0, express_1.default)();
// ─── Security Headers (Helmet) ───────────────────────────────────────────────
app.use((0, helmet_1.default)());
// ─── CORS (restrict to known origin) ─────────────────────────────────────────
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (server-to-server, Postman in dev)
        if (!origin)
            return callback(null, true);
        if (origin === ALLOWED_ORIGIN ||
            origin === "http://localhost:3000" ||
            origin === "http://127.0.0.1:3000") {
            return callback(null, true);
        }
        return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: "2mb" }));
// ─── Rate Limiting on Auth Routes ─────────────────────────────────────────────
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again in 15 minutes." },
});
// ─── General API Rate Limit ───────────────────────────────────────────────────
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute per IP
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
app.use("/api/auth", authLimiter, auth_routes_1.default);
app.use("/api/products", apiLimiter, product_routes_1.default);
app.use("/api/cart", apiLimiter, cart_routes_1.default);
app.use("/api/settings", apiLimiter, settings_routes_1.default);
app.use("/api/coupons", apiLimiter, coupon_routes_1.default);
app.use("/api/orders", apiLimiter, order_routes_1.default);
app.use("/api/customers", apiLimiter, customer_routes_1.default);
app.use("/api/analytics", apiLimiter, analytics_routes_1.default);
app.use("/api/payment", apiLimiter, payment_routes_1.default);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} | ENV: ${process.env.NODE_ENV || "development"}`);
});
//# sourceMappingURL=server.js.map