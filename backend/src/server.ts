import "dotenv/config";
import logger from "./lib/logger";

// ─── Env Guards ──────────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}

import app from "./app";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} | ENV: ${process.env.NODE_ENV || "development"}`);
});
