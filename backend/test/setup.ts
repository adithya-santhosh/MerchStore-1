// Runs before every test file — provides the env vars app.ts / auth.middleware.ts
// require at import time, so tests never depend on a developer's local .env.
process.env.JWT_SECRET ||= "test-jwt-secret-do-not-use-in-production";
process.env.NODE_ENV = "test";
// Syntactically valid but unreachable — lets lib/prisma.ts construct its
// client without a real database. Tests that exercise DB-touching code mock
// "../lib/prisma" directly instead of relying on this connection working.
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
// Mirror the deployed topology (one proxy hop, as on Render) so tests exercise
// the same client-IP resolution production uses for rate limiting.
process.env.TRUST_PROXY_HOPS ||= "1";
