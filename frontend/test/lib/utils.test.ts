import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getErrorMessage } from "@/lib/errors";

const { signatureMock } = vi.hoisted(() => ({ signatureMock: vi.fn() }));
vi.mock("@/lib/api", () => ({ getUploadSignature: signatureMock }));

import { cn, getProductImageSrc, safeCallbackUrl, uploadToCloudinary } from "@/lib/utils";

describe("cn", () => {
  it("joins several class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values from conditional classes", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("lets a later Tailwind utility win over an earlier conflicting one", () => {
    // This is the whole point of twMerge: `px-4 px-2` must collapse to `px-2`.
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("keeps non-conflicting utilities side by side", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("accepts arrays and objects the way clsx does", () => {
    expect(cn(["a", "b"], { c: true, d: false })).toBe("a b c");
  });

  it("returns an empty string when given nothing", () => {
    expect(cn()).toBe("");
  });
});

describe("getProductImageSrc", () => {
  it("returns null for a missing URL", () => {
    expect(getProductImageSrc(null)).toBeNull();
    expect(getProductImageSrc(undefined)).toBeNull();
    expect(getProductImageSrc("")).toBeNull();
  });

  it("passes an https URL through untouched", () => {
    expect(getProductImageSrc("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg"
    );
  });

  it("passes an http URL through untouched", () => {
    expect(getProductImageSrc("http://cdn.example.com/a.jpg")).toBe(
      "http://cdn.example.com/a.jpg"
    );
  });

  it("rewrites a legacy /products/ path out of the way of the /products/[id] route", () => {
    // Otherwise the image request is captured by the product detail route.
    expect(getProductImageSrc("/products/rack.jpg")).toBe("/images/products/rack.jpg");
  });

  it("leaves any other root-relative path alone", () => {
    expect(getProductImageSrc("/images/hero.jpg")).toBe("/images/hero.jpg");
  });

  it("does not rewrite a remote URL that merely contains /products/", () => {
    expect(getProductImageSrc("https://cdn.example.com/products/rack.jpg")).toBe(
      "https://cdn.example.com/products/rack.jpg"
    );
  });

  it("rewrites only the leading occurrence", () => {
    expect(getProductImageSrc("/products/a/products/b.jpg")).toBe(
      "/images/products/a/products/b.jpg"
    );
  });
});

describe("getErrorMessage", () => {
  it("prefers a real Error's message", () => {
    expect(getErrorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("falls back when the Error has an empty message", () => {
    expect(getErrorMessage(new Error(""), "fallback")).toBe("fallback");
  });

  it("accepts a thrown string", () => {
    expect(getErrorMessage("plain failure", "fallback")).toBe("plain failure");
  });

  it("falls back for an empty thrown string", () => {
    expect(getErrorMessage("", "fallback")).toBe("fallback");
  });

  it("reads message off a plain rejection object", () => {
    // Some libraries reject with { message } rather than an Error.
    expect(getErrorMessage({ message: "api said no" }, "fallback")).toBe("api said no");
  });

  it("falls back when the object's message is not a string", () => {
    expect(getErrorMessage({ message: 42 }, "fallback")).toBe("fallback");
  });

  it("falls back when the object's message is empty", () => {
    expect(getErrorMessage({ message: "" }, "fallback")).toBe("fallback");
  });

  it("falls back for null, undefined and numbers", () => {
    expect(getErrorMessage(null, "fallback")).toBe("fallback");
    expect(getErrorMessage(undefined, "fallback")).toBe("fallback");
    expect(getErrorMessage(500, "fallback")).toBe("fallback");
  });

  it("falls back for an object with no message at all", () => {
    expect(getErrorMessage({ status: 500 }, "fallback")).toBe("fallback");
  });

  it("keeps the message of an Error subclass", () => {
    class ApiError extends Error {}
    expect(getErrorMessage(new ApiError("not found"), "fallback")).toBe("not found");
  });
});

describe("safeCallbackUrl", () => {
  it("keeps an in-site path", () => {
    expect(safeCallbackUrl("/checkout")).toBe("/checkout");
    expect(safeCallbackUrl("/")).toBe("/");
  });

  it("keeps a query string and hash on an in-site path", () => {
    expect(safeCallbackUrl("/checkout?step=2#pay")).toBe("/checkout?step=2#pay");
  });

  it("rejects a protocol-relative URL", () => {
    expect(safeCallbackUrl("//evil.example")).toBe("/");
    // Browsers normalise the backslash to "/", making this off-site too.
    expect(safeCallbackUrl("/\\evil.example")).toBe("/");
  });

  it("rejects an absolute URL", () => {
    expect(safeCallbackUrl("https://evil.example/checkout")).toBe("/");
  });

  it("rejects a javascript: URL", () => {
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/");
  });

  it("rejects a bare relative path that isn't rooted", () => {
    expect(safeCallbackUrl("checkout")).toBe("/");
  });

  it("falls back for empty, null and undefined", () => {
    expect(safeCallbackUrl("")).toBe("/");
    expect(safeCallbackUrl(null)).toBe("/");
    expect(safeCallbackUrl(undefined)).toBe("/");
  });

  it("honours a custom fallback", () => {
    expect(safeCallbackUrl("//evil.example", "/login")).toBe("/login");
  });
});

describe("uploadToCloudinary", () => {
  const signature = {
    timestamp: 1234567890,
    signature: "abc123",
    apiKey: "key123",
    cloudName: "demo",
    folder: "products",
    allowedFormats: "jpg,jpeg,png,webp,gif",
  };

  const fetchMock = vi.fn();

  beforeEach(() => {
    signatureMock.mockReset().mockResolvedValue(signature);
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gets a fresh signature for every upload rather than reusing one", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ secure_url: "https://res.cloudinary.com/demo/x.jpg" }) });
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });

    await uploadToCloudinary(file);

    expect(signatureMock).toHaveBeenCalledOnce();
  });

  it("uploads to the signed cloud name, carrying exactly the signed parameters", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ secure_url: "https://res.cloudinary.com/demo/x.jpg" }) });
    const file = new File(["data"], "photo.jpg", { type: "image/jpeg" });

    await uploadToCloudinary(file);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    const body = init.body as FormData;
    expect(body.get("file")).toBe(file);
    expect(body.get("api_key")).toBe("key123");
    expect(body.get("timestamp")).toBe("1234567890");
    expect(body.get("signature")).toBe("abc123");
    expect(body.get("folder")).toBe("products");
    expect(body.get("allowed_formats")).toBe("jpg,jpeg,png,webp,gif");
  });

  it("returns the secure URL Cloudinary hands back", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ secure_url: "https://res.cloudinary.com/demo/x.jpg" }),
    });

    const url = await uploadToCloudinary(new File(["data"], "photo.jpg", { type: "image/jpeg" }));

    expect(url).toBe("https://res.cloudinary.com/demo/x.jpg");
  });

  // Cloudinary names the real cause; the admin form can only report what it is
  // told. Flattening every failure into one guess is what made a server with no
  // CLOUDINARY_API_KEY look like an unsupported-file-type problem.
  it("surfaces the reason Cloudinary gives for rejecting an upload", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "Format exe not allowed" } }),
    });

    await expect(
      uploadToCloudinary(new File(["data"], "malware.exe", { type: "application/octet-stream" }))
    ).rejects.toThrow("Format exe not allowed");
  });

  it("falls back to the status when the rejection carries no message", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    await expect(
      uploadToCloudinary(new File(["data"], "photo.jpg", { type: "image/jpeg" }))
    ).rejects.toThrow("Cloudinary rejected the upload (HTTP 401)");
  });

  it("falls back to the status when the error body is not JSON", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });

    await expect(
      uploadToCloudinary(new File(["data"], "photo.jpg", { type: "image/jpeg" }))
    ).rejects.toThrow("Cloudinary rejected the upload (HTTP 502)");
  });

  // The exact failure the admin hit: the API refuses to sign because the
  // Cloudinary credentials are missing, and that reason must reach the form.
  it("propagates an unconfigured-server message from the signature step", async () => {
    signatureMock.mockReset().mockRejectedValue(new Error("Image upload is not configured"));

    await expect(
      uploadToCloudinary(new File(["data"], "photo.png", { type: "image/png" }))
    ).rejects.toThrow("Image upload is not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propagates a failure to obtain a signature (e.g. not an admin)", async () => {
    signatureMock.mockReset().mockRejectedValue(new Error("Not authenticated"));

    await expect(
      uploadToCloudinary(new File(["data"], "photo.jpg", { type: "image/jpeg" }))
    ).rejects.toThrow("Not authenticated");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
