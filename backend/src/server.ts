import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes";

const PORT = process.env.PORT || 5000

const app = express();

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend Running");
});



app.use("/api/products", productRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

