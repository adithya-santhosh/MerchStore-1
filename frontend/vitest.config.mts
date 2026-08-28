import { defineConfig } from "vitest/config";
import path from "node:path";

const here = import.meta.dirname;

// Unit tests for the framework-independent logic: metadata builders, the API
// client, cookie/error helpers and the edge middleware. Rendering React Server
// Components needs the Next runtime, so pages and components stay out of scope
// here and are covered by the backend contract tests plus manual QA.
//
// Tests live under test/, mirroring the src/ tree they cover:
//   src/lib/seo.ts  ->  test/lib/seo.test.ts
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(here, "./src"),
    },
  },
});
