import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import settingsRoutes from "./routes/settings.routes";
import couponRoutes from "./routes/coupon.routes";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";

const PORT = process.env.PORT || 5000

const app = express();

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend Running");
});



app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
