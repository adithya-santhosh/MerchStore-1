import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { v2 as cloudinary } from "cloudinary";
import { createUploadSignature } from "../../src/lib/cloudinary";

const ORIGINAL_ENV = { ...process.env };

describe("createUploadSignature", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("returns null when Cloudinary isn't configured", () => {
    delete process.env.CLOUDINARY_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    expect(createUploadSignature()).toBeNull();
  });

  it("returns null when only some of the three vars are set", () => {
    process.env.CLOUDINARY_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key123";
    delete process.env.CLOUDINARY_API_SECRET;

    expect(createUploadSignature()).toBeNull();
  });

  describe("when configured", () => {
    beforeEach(() => {
      process.env.CLOUDINARY_NAME = "demo";
      process.env.CLOUDINARY_API_KEY = "key123";
      process.env.CLOUDINARY_API_SECRET = "shh-its-a-secret";
    });

    it("returns the cloud name and API key unchanged", () => {
      const result = createUploadSignature()!;

      expect(result.cloudName).toBe("demo");
      expect(result.apiKey).toBe("key123");
    });

    it("never returns the API secret itself", () => {
      const result = createUploadSignature()!;

      expect(JSON.stringify(result)).not.toContain("shh-its-a-secret");
    });

    it("restricts uploads to a fixed, non-svg image format whitelist", () => {
      const result = createUploadSignature()!;

      expect(result.allowedFormats).toBe("jpg,jpeg,png,webp,gif");
      expect(result.allowedFormats).not.toContain("svg");
    });

    it("produces a signature Cloudinary itself would accept for these exact params", () => {
      const result = createUploadSignature()!;

      const expected = cloudinary.utils.api_sign_request(
        {
          timestamp: result.timestamp,
          folder: result.folder,
          allowed_formats: result.allowedFormats,
        },
        "shh-its-a-secret"
      );
      expect(result.signature).toBe(expected);
    });

    it("changing any signed parameter invalidates the signature", () => {
      const result = createUploadSignature()!;

      const tamperedFormats = cloudinary.utils.api_sign_request(
        { timestamp: result.timestamp, folder: result.folder, allowed_formats: "jpg,jpeg,png,webp,gif,svg" },
        "shh-its-a-secret"
      );
      expect(tamperedFormats).not.toBe(result.signature);
    });
  });
});
