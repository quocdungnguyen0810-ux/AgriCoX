/**
 * Signing Token Utility
 *
 * Pure utility module for generating, hashing, and validating signing tokens.
 * Uses Node.js crypto for cryptographically secure random generation and SHA-256 hashing.
 *
 * Security model:
 * - Raw token: 32 random bytes → base64url (43 chars). Shown only to the link recipient.
 * - Token hash: SHA-256(rawToken) → hex (64 chars). Stored in ContractSignature.signingTokenHash.
 * - The raw token is NEVER stored in the database.
 * - Token lookup: hash the presented token → findUnique by signingTokenHash.
 *
 * This module has NO database access, NO Prisma imports, NO side effects.
 * DB validation is handled in Step 5B.8C / 5B.9.
 *
 * Manual test:
 *   npx tsx -e "import { generateSigningToken, hashSigningToken, buildSigningUrl, isLikelyValidRawToken } from './src/lib/signing-token'; const t = generateSigningToken(); console.log(t); console.log('hash check:', hashSigningToken(t.rawToken) === t.tokenHash); console.log('url:', buildSigningUrl('test-id', t.rawToken)); console.log('valid:', isLikelyValidRawToken(t.rawToken));"
 */

import { randomBytes, createHash } from "crypto";

// ── Constants ──────────────────────────────────────────

/** Number of random bytes used to generate a signing token. */
export const SIGNING_TOKEN_BYTES = 32;

/** Default token expiry in hours. */
export const SIGNING_TOKEN_DEFAULT_EXPIRY_HOURS = 72;

/**
 * Minimum length of a base64url-encoded token from SIGNING_TOKEN_BYTES.
 * 32 bytes → ceil(32 * 4/3) = 43 chars in base64url (no padding).
 */
const MIN_RAW_TOKEN_LENGTH = 40;

// ── Token Generation ───────────────────────────────────

/**
 * Generate a cryptographically secure signing token.
 *
 * Returns the raw token (for the URL), its SHA-256 hash (for DB storage),
 * and the expiry timestamp. The raw token must NEVER be stored — only the hash.
 *
 * @param expiryHours — Token validity period in hours. Defaults to 72.
 * @returns {{ rawToken: string; tokenHash: string; expiresAt: Date }}
 */
export function generateSigningToken(expiryHours?: number): {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const rawToken = randomBytes(SIGNING_TOKEN_BYTES).toString("base64url");
  const tokenHash = hashSigningToken(rawToken);
  const expiresAt = getSigningTokenExpiry(expiryHours);

  return { rawToken, tokenHash, expiresAt };
}

// ── Token Hashing ──────────────────────────────────────

/**
 * Compute the SHA-256 hash of a raw signing token.
 *
 * This is the value stored in ContractSignature.signingTokenHash.
 * When a user presents a token, we hash it and look up the hash.
 *
 * @param rawToken — The raw base64url token string.
 * @returns 64-character lowercase hex string.
 * @throws {Error} If rawToken is empty or falsy.
 */
export function hashSigningToken(rawToken: string): string {
  if (!rawToken || rawToken.trim() === "") {
    throw new Error("Cannot hash an empty signing token");
  }

  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

// ── Expiry Helper ──────────────────────────────────────

/**
 * Calculate the token expiry timestamp.
 *
 * @param hours — Number of hours from now. Defaults to SIGNING_TOKEN_DEFAULT_EXPIRY_HOURS (72).
 *                Invalid or non-positive values fall back to the default.
 * @returns Date object representing the expiry time.
 */
export function getSigningTokenExpiry(hours?: number): Date {
  const safeHours =
    typeof hours === "number" && Number.isFinite(hours) && hours > 0
      ? hours
      : SIGNING_TOKEN_DEFAULT_EXPIRY_HOURS;

  return new Date(Date.now() + safeHours * 60 * 60 * 1000);
}

// ── Signing URL Builder ────────────────────────────────

/**
 * Build the signing URL for a contract.
 *
 * The raw token is placed in the query string — it is the secret that
 * proves the signer's identity. The tokenHash is NEVER included in the URL.
 *
 * @param contractId — The contract's cuid.
 * @param rawToken   — The raw base64url token (from generateSigningToken).
 * @param baseUrl    — Optional base URL (e.g. "https://app.greenpeat.vn").
 *                     If omitted, returns a relative path.
 * @returns Signing URL string.
 */
export function buildSigningUrl(
  contractId: string,
  rawToken: string,
  baseUrl?: string
): string {
  const encodedToken = encodeURIComponent(rawToken);
  const encodedId = encodeURIComponent(contractId);
  const path = `/sign/${encodedId}?token=${encodedToken}`;

  if (baseUrl) {
    // Strip trailing slash from baseUrl
    const cleanBase = baseUrl.replace(/\/+$/, "");
    return `${cleanBase}${path}`;
  }

  return path;
}

// ── Format Guard ───────────────────────────────────────

/**
 * Quick format check: does this string look like a valid raw signing token?
 *
 * This is NOT a database validation — it only checks the token format
 * (non-empty, sufficient length for 32-byte base64url encoding).
 * Use this as a fast-fail guard before attempting DB lookup.
 *
 * @param rawToken — The candidate token string.
 * @returns true if the format is plausible.
 */
export function isLikelyValidRawToken(rawToken: string): boolean {
  if (!rawToken || typeof rawToken !== "string") return false;
  if (rawToken.trim().length < MIN_RAW_TOKEN_LENGTH) return false;
  return true;
}
