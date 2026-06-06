import express from "express";
import cors from "cors";
import productRoutes from "./routes/product.routes";


const app = express();

app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send("Backend Running");
});



app.use("/api/products", productRoutes);

app.listen(5000, () => {
  console.log("Server running");
});

