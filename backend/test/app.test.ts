import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("app", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET / returns a plain-text confirmation", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Backend Running");
  });

  it("blocks an admin route with no auth token", async () => {
    const res = await request(app).get("/api/products/admin/stats");
    expect(res.status).toBe(401);
  });
});

describe("error handling", () => {
  it("returns JSON 404 for an unknown route, not an HTML page", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("rejects a disallowed CORS origin with 403 rather than 500", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://not-our-frontend.example.com");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Origin not allowed");
    // The whole point: a blocked origin must not look like a server fault.
    expect(res.status).not.toBe(500);
  });

  it("still allows a permitted origin through", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("answers 400 for malformed JSON instead of crashing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "broken"'); // deliberately truncated

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/malformed json/i);
  });

  it("never leaks a stack trace to the client", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\(/);
    expect(res.body).not.toHaveProperty("stack");
  });
});

describe("proxy trust / rate-limit isolation", () => {
  it("trusts a bounded number of proxy hops rather than every hop", () => {
    // `true` would let any client forge X-Forwarded-For and evade rate limiting.
    const setting = app.get("trust proxy");
    expect(setting).not.toBe(true);
    expect(typeof setting).toBe("number");
  });

  it("gives each forwarded client IP its own rate-limit budget", async () => {
    // Behind a proxy without `trust proxy`, req.ip is the proxy's address for
    // everyone, so all customers share one counter and a handful of failed
    // logins locks out the whole store. Two distinct client IPs must therefore
    // consume from two distinct budgets.
    const post = (clientIp: string) =>
      request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", clientIp)
        .send({}); // rejected by Zod before any DB access

    const first = await post("203.0.113.10");
    const second = await post("203.0.113.10");
    const otherClient = await post("198.51.100.20");

    const remaining = (res: request.Response) =>
      Number(res.headers["ratelimit-remaining"]);

    // Same client: the budget visibly draws down.
    expect(remaining(second)).toBe(remaining(first) - 1);

    // Different client: starts from its own budget, unaffected by the first.
    expect(remaining(otherClient)).toBe(remaining(first));
  });
});
