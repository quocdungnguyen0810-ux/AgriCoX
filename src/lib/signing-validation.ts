/**
 * Signing Link Validation (Server-side, Prisma-dependent)
 *
 * Validates a raw signing token against the database.
 * Used by the public signing page /sign/[contractId] to verify token integrity.
 *
 * Security rules:
 * - Hash the raw token, look up by signingTokenHash.
 * - Never reveal whether a contract exists on invalid token.
 * - Never log or return the raw token.
 * - All checks are server-side.
 *
 * TODO(Phase 5B.10): After successful signing, update tokenUsedAt + signedAt.
 */

import prisma from "@/lib/prisma";
import { hashSigningToken } from "@/lib/signing-token";

/** Data returned on successful validation — safe for public display. */
export interface ValidatedSigningData {
  signatureId: string;
  contractId: string;
  signerRole: string;
  signerName: string;
  signerEmail: string | null;
  signerCompany: string | null;
  tokenExpiresAt: Date;
  signingVersion: number;
  contract: {
    contractCode: string;
    status: string;
    totalAmount: number;
    currency: string;
    locale: string;
    contractDate: Date | null;
    effectiveDate: Date | null;
    expiryDate: Date | null;
    paymentTerms: string | null;
    deliveryTerms: string | null;
    incoterm: string | null;
    deliveryLocation: string | null;
    contentVi: string | null;
    contentEn: string | null;
    customer: {
      name: string;
      companyName: string | null;
    };
    order: {
      orderCode: string;
    } | null;
  };
}

export type SigningValidationResult =
  | { valid: true; data: ValidatedSigningData }
  | { valid: false; reason: string };

/**
 * Validate a signing link token against the database.
 *
 * @param contractId — The contract ID from the URL path.
 * @param rawToken   — The raw token from the query parameter.
 * @returns Validation result with contract data or a safe error reason.
 */
export async function validateSigningLink(
  contractId: string,
  rawToken: string
): Promise<SigningValidationResult> {
  // Guard: empty inputs
  if (!contractId || !rawToken || rawToken.trim() === "") {
    return { valid: false, reason: "INVALID_LINK" };
  }

  let tokenHash: string;
  try {
    tokenHash = hashSigningToken(rawToken);
  } catch {
    return { valid: false, reason: "INVALID_LINK" };
  }

  // Look up by unique hash
  const signature = await prisma.contractSignature.findUnique({
    where: { signingTokenHash: tokenHash },
    include: {
      contract: {
        select: {
          id: true,
          contractCode: true,
          status: true,
          totalAmount: true,
          currency: true,
          locale: true,
          contractDate: true,
          effectiveDate: true,
          expiryDate: true,
          paymentTerms: true,
          deliveryTerms: true,
          incoterm: true,
          deliveryLocation: true,
          contentVi: true,
          contentEn: true,
          customer: {
            select: { name: true, companyName: true },
          },
          order: {
            select: { orderCode: true },
          },
        },
      },
    },
  });

  // Generic error for all invalid cases — do not reveal contract existence
  const GENERIC_ERROR = "INVALID_OR_EXPIRED";

  if (!signature) return { valid: false, reason: GENERIC_ERROR };

  // Must belong to the correct contract
  if (signature.contractId !== contractId) {
    return { valid: false, reason: GENERIC_ERROR };
  }

  // Must not be used
  if (signature.tokenUsedAt !== null) {
    return { valid: false, reason: "TOKEN_ALREADY_USED" };
  }

  // Must not be revoked
  if (signature.tokenRevokedAt !== null) {
    return { valid: false, reason: GENERIC_ERROR };
  }

  // Must not be expired
  if (signature.tokenExpiresAt && signature.tokenExpiresAt < new Date()) {
    return { valid: false, reason: "TOKEN_EXPIRED" };
  }

  // Must be PENDING
  if (signature.status !== "PENDING") {
    return { valid: false, reason: GENERIC_ERROR };
  }

  // Contract status must allow signing for this role
  const ROLE_STATUS_MAP: Record<string, string> = {
    CUSTOMER: "SENT_TO_CUSTOMER",
    GREENPEAT_SIGNER: "SIGNED_BY_CUSTOMER",
  };

  const requiredStatus = ROLE_STATUS_MAP[signature.signerRole];
  if (!requiredStatus || signature.contract.status !== requiredStatus) {
    return { valid: false, reason: "CONTRACT_STATUS_MISMATCH" };
  }

  return {
    valid: true,
    data: {
      signatureId: signature.id,
      contractId: signature.contractId,
      signerRole: signature.signerRole,
      signerName: signature.signerName,
      signerEmail: signature.signerEmail,
      signerCompany: signature.signerCompany,
      tokenExpiresAt: signature.tokenExpiresAt!,
      signingVersion: signature.signingVersion,
      contract: signature.contract,
    },
  };
}
