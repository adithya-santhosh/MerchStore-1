import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./app";

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
