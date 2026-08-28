import { defineConfig } from "vitest/config";

// Tests live under test/, mirroring the src/ tree they cover:
//   src/services/cart.service.ts  ->  test/services/cart.service.test.ts
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts"],
  },
});
