import { v2 as cloudinary } from "cloudinary";
import logger from "./logger";

// Product photos only — jpg/png/webp/gif. Deliberately excludes svg: Cloudinary
// accepts it as a valid image format, but an SVG can carry a <script> and this
// whitelist is the one thing standing between an upload and Cloudinary's own
// format check.
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,gif";
const UPLOAD_FOLDER = "products";

export interface UploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string;
}

/**
 * A short-lived, server-signed set of upload parameters for the browser to
 * hand straight to Cloudinary. The signature covers `timestamp`, `folder` and
 * `allowed_formats`, so the browser can't widen the format whitelist or
 * redirect the upload elsewhere without invalidating it — Cloudinary itself
 * rejects anything that doesn't match. Returns null if the account isn't
 * configured, same as the email service degrading when RESEND_API_KEY is
 * unset: image upload is one feature, not something worth crashing the
 * server over.
 */
export const createUploadSignature = (): UploadSignature | null => {
  const cloudName = process.env.CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    logger.warn(
      "[Cloudinary] CLOUDINARY_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET not fully set. Image upload is disabled."
    );
    return null;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: UPLOAD_FOLDER, allowed_formats: ALLOWED_FORMATS };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    timestamp,
    signature,
    apiKey,
    cloudName,
    folder: UPLOAD_FOLDER,
    allowedFormats: ALLOWED_FORMATS,
  };
};
