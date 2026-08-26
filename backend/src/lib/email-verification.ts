import jwt from "jsonwebtoken";

/**
 * Email verification tokens.
 *
 * Unlike password reset, these are stateless signed tokens rather than rows in
 * a table. Two reasons:
 *
 *   1. Verification is idempotent — replaying a token just re-verifies an
 *      already-verified address, so the single-use guarantee that matters for
 *      password reset buys nothing here.
 *   2. It needs no schema change, so enabling verification doesn't require a
 *      migration against a live database.
 *
 * The token embeds the email it was issued for, so if the address is later
 * changed any outstanding token for the old one stops applying.
 */
const JWT_SECRET = process.env.JWT_SECRET!;

const TOKEN_PURPOSE = "email-verification";
export const VERIFICATION_TOKEN_TTL = "24h";

interface VerificationPayload {
  userId: number;
  email: string;
  purpose: typeof TOKEN_PURPOSE;
}

export const createEmailVerificationToken = (userId: number, email: string): string =>
  jwt.sign(
    { userId, email, purpose: TOKEN_PURPOSE } satisfies VerificationPayload,
    JWT_SECRET,
    { expiresIn: VERIFICATION_TOKEN_TTL }
  );

/**
 * Returns the payload for a valid token, or null for anything else — expired,
 * tampered with, or a token minted for a different purpose (e.g. replaying a
 * session JWT here, which must never grant verification).
 */
export const readEmailVerificationToken = (
  token: string
): { userId: number; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Partial<VerificationPayload>;

    if (decoded.purpose !== TOKEN_PURPOSE) return null;
    if (typeof decoded.userId !== "number" || typeof decoded.email !== "string") return null;

    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
};
