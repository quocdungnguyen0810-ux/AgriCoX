"use server";

/**
 * Public signing actions.
 *
 * These actions are used by the public /sign/[contractId] page.
 * They are separate from admin actions to maintain clean separation.
 *
 * TODO(Phase 5B.12): Add draw signature and upload signature image methods.
 * TODO(Phase 6A): Generate signed contract PDF after both parties sign.
 * TODO(Phase 6B): Upload signed PDF to Google Drive.
 * TODO(Phase 6C): Sync signing status to Google Sheet CONTRACT_LOG.
 * TODO(Phase 7): Use authenticated user/session for GreenPeat signer.
 */

import prisma from "@/lib/prisma";
import { hashSigningToken } from "@/lib/signing-token";
import { validateContractTransition } from "@/lib/contract-status";
import { headers } from "next/headers";

/** The exact consent text shown to signers. */
const CONSENT_TEXT_VI =
  "Tôi xác nhận đã đọc, hiểu và đồng ý với nội dung hợp đồng này.";

/** Contract status that each signer role advances to after signing. */
const ROLE_NEXT_STATUS: Record<string, string> = {
  CUSTOMER: "SIGNED_BY_CUSTOMER",
  GREENPEAT_SIGNER: "SIGNED_BY_GREENPEAT",
};

/** Required contract status for each signer role. */
const ROLE_REQUIRED_STATUS: Record<string, string> = {
  CUSTOMER: "SENT_TO_CUSTOMER",
  GREENPEAT_SIGNER: "SIGNED_BY_CUSTOMER",
};

type SubmitResult =
  | { success: true; message: string }
  | { success: false; error: string };

/**
 * Submit a TYPE_NAME signature for a contract.
 *
 * Validates the token, records the signature, advances the contract status,
 * and marks the token as used — all atomically in a single transaction.
 *
 * @param contractId     — The contract ID from the URL.
 * @param rawToken       — The raw signing token from the URL query.
 * @param typedSignature — The signer's full name typed as signature.
 * @param consentAccepted — Whether the signer checked the consent box.
 */
export async function submitTypedSignature(
  contractId: string,
  rawToken: string,
  typedSignature: string,
  consentAccepted: boolean
): Promise<SubmitResult> {
  try {
    // ── 1. Input validation ──
    if (!rawToken || rawToken.trim() === "") {
      return { success: false, error: "Liên kết ký không hợp lệ." };
    }

    if (!typedSignature || typedSignature.trim().length < 2) {
      return { success: false, error: "Vui lòng nhập họ và tên đầy đủ (tối thiểu 2 ký tự)." };
    }

    if (!consentAccepted) {
      return {
        success: false,
        error: "Vui lòng xác nhận đã đọc và đồng ý với nội dung hợp đồng.",
      };
    }

    // ── 2. Hash token and find signature ──
    let tokenHash: string;
    try {
      tokenHash = hashSigningToken(rawToken);
    } catch {
      return { success: false, error: "Liên kết ký không hợp lệ." };
    }

    const signature = await prisma.contractSignature.findUnique({
      where: { signingTokenHash: tokenHash },
      include: {
        contract: { select: { id: true, status: true } },
      },
    });

    // ── 3. Token validation (same 8 checks as validateSigningLink) ──
    if (!signature) {
      return { success: false, error: "Liên kết ký không hợp lệ hoặc đã hết hạn." };
    }

    if (signature.contractId !== contractId) {
      return { success: false, error: "Liên kết ký không hợp lệ hoặc đã hết hạn." };
    }

    if (signature.tokenUsedAt !== null) {
      return { success: false, error: "Liên kết ký này đã được sử dụng." };
    }

    if (signature.tokenRevokedAt !== null) {
      return { success: false, error: "Liên kết ký không hợp lệ hoặc đã hết hạn." };
    }

    if (signature.tokenExpiresAt && signature.tokenExpiresAt < new Date()) {
      return { success: false, error: "Liên kết ký đã hết hạn. Vui lòng liên hệ GreenPeat để được cấp lại." };
    }

    if (signature.status !== "PENDING") {
      return { success: false, error: "Liên kết ký không hợp lệ hoặc đã hết hạn." };
    }

    const requiredStatus = ROLE_REQUIRED_STATUS[signature.signerRole];
    if (!requiredStatus || signature.contract.status !== requiredStatus) {
      return {
        success: false,
        error: "Hợp đồng không ở trạng thái cho phép ký. Vui lòng liên hệ GreenPeat.",
      };
    }

    // ── 4. Determine next contract status ──
    const nextStatus = ROLE_NEXT_STATUS[signature.signerRole];
    if (!nextStatus) {
      return { success: false, error: "Vai trò ký không hợp lệ." };
    }

    // Verify the transition is allowed by the state machine
    if (!validateContractTransition(signature.contract.status, nextStatus)) {
      return {
        success: false,
        error: "Không thể chuyển trạng thái hợp đồng. Vui lòng liên hệ GreenPeat.",
      };
    }

    // ── 5. Capture request metadata ──
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    try {
      const hdrs = await headers();
      ipAddress =
        hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        hdrs.get("x-real-ip") ||
        null;
      userAgent = hdrs.get("user-agent") || null;
    } catch {
      // headers() may not be available in all environments
    }

    const now = new Date();
    const oldStatus = signature.contract.status;
    const signerLabel =
      signature.signerRole === "CUSTOMER" ? "Khách hàng" : "Đại diện GreenPeat";

    // ── 6. Atomic transaction: signature + contract status + log ──
    await prisma.$transaction(async (tx) => {
      // Update ContractSignature
      await tx.contractSignature.update({
        where: { id: signature.id },
        data: {
          signatureMethod: "TYPE_NAME",
          typedSignature: typedSignature.trim(),
          signedConsentText: CONSENT_TEXT_VI,
          signedAt: now,
          tokenUsedAt: now,
          ipAddress,
          userAgent,
          status: "SIGNED",
        },
      });

      // Update Contract status
      await tx.contract.update({
        where: { id: contractId },
        data: { status: nextStatus },
      });

      // Create ContractStatusLog
      await tx.contractStatusLog.create({
        data: {
          contractId,
          oldStatus,
          newStatus: nextStatus,
          note: `${signerLabel} đã ký hợp đồng bằng chữ ký nhập tên`,
          changedBy: null, // TODO(Phase 7): populate from session
        },
      });
    });

    return {
      success: true,
      message: "Cảm ơn. Hợp đồng đã được ký thành công.",
    };
  } catch (err) {
    console.error("[submitTypedSignature]", err);
    return {
      success: false,
      error: "Lỗi hệ thống khi xử lý chữ ký. Vui lòng thử lại hoặc liên hệ GreenPeat.",
    };
  }
}

/**
 * Reject a contract and request revision (CUSTOMER only).
 *
 * Validates the signing token, records the rejection reason, revokes the token,
 * and moves the contract back to NEGOTIATING so admin can revise it.
 *
 * Only CUSTOMER signers can reject. GREENPEAT_SIGNER rejection is not supported.
 *
 * @param contractId   — The contract ID from the URL.
 * @param rawToken     — The raw signing token from the URL query.
 * @param rejectReason — The customer's reason for requesting revision.
 *
 * TODO(Phase 6A): Regenerate contract PDF after revision.
 * TODO(Phase 6B): Update Google Drive files after revision.
 * TODO(Phase 6C): Sync rejection/revision to Google Sheet CONTRACT_LOG.
 * TODO(Phase 7): Notify sales by email/internal notification.
 * TODO(Phase 7): Add customer revision comment history.
 */
export async function rejectContractSignature(
  contractId: string,
  rawToken: string,
  rejectReason: string
): Promise<SubmitResult> {
  try {
    // ── 1. Input validation ──
    if (!rawToken || rawToken.trim() === "") {
      return { success: false, error: "Liên kết ký không hợp lệ." };
    }

    if (!rejectReason || rejectReason.trim().length < 5) {
      return {
        success: false,
        error: "Vui lòng nhập lý do yêu cầu chỉnh sửa (tối thiểu 5 ký tự).",
      };
    }

    // ── 2. Hash token and find signature ──
    let tokenHash: string;
    try {
      tokenHash = hashSigningToken(rawToken);
    } catch {
      return { success: false, error: "Liên kết ký không hợp lệ." };
    }

    const signature = await prisma.contractSignature.findUnique({
      where: { signingTokenHash: tokenHash },
      include: {
        contract: { select: { id: true, status: true } },
      },
    });

    // ── 3. Token validation ──
    if (!signature) {
      return { success: false, error: "Liên kết ký không hợp lệ hoặc đã hết hạn." };
    }

    if (signature.contractId !== contractId) {
      return { success: false, error: "Liên kết ký không hợp lệ hoặc đã hết hạn." };
    }

    if (signature.tokenUsedAt !== null) {
      return { success: false, error: "Liên kết ký này đã được sử dụng." };
    }

    if (signature.tokenRevokedAt !== null) {
      return { success: false, error: "Liên kết ký không hợp lệ hoặc đã hết hạn." };
    }

    if (signature.tokenExpiresAt && signature.tokenExpiresAt < new Date()) {
      return { success: false, error: "Liên kết ký đã hết hạn. Vui lòng liên hệ GreenPeat để được cấp lại." };
    }

    if (signature.status !== "PENDING") {
      return { success: false, error: "Liên kết ký không hợp lệ hoặc đã hết hạn." };
    }

    // ── 4. Only CUSTOMER can reject ──
    if (signature.signerRole !== "CUSTOMER") {
      return {
        success: false,
        error: "Chỉ khách hàng mới có thể yêu cầu chỉnh sửa hợp đồng.",
      };
    }

    // ── 5. Contract must be SENT_TO_CUSTOMER ──
    if (signature.contract.status !== "SENT_TO_CUSTOMER") {
      return {
        success: false,
        error: "Hợp đồng không ở trạng thái cho phép yêu cầu chỉnh sửa.",
      };
    }

    // ── 6. Verify SENT_TO_CUSTOMER → NEGOTIATING transition ──
    if (!validateContractTransition("SENT_TO_CUSTOMER", "NEGOTIATING")) {
      return {
        success: false,
        error: "Không thể chuyển trạng thái hợp đồng. Vui lòng liên hệ GreenPeat.",
      };
    }

    const now = new Date();
    const trimmedReason = rejectReason.trim();

    // ── 7. Atomic transaction: reject signature + contract → NEGOTIATING + log ──
    await prisma.$transaction(async (tx) => {
      // Update ContractSignature — rejection (NOT signing)
      await tx.contractSignature.update({
        where: { id: signature.id },
        data: {
          status: "REJECTED",
          rejectReason: trimmedReason,
          tokenRevokedAt: now,
          // Do NOT set tokenUsedAt, signedAt, signatureMethod, typedSignature, signedConsentText
        },
      });

      // Move contract to NEGOTIATING
      await tx.contract.update({
        where: { id: contractId },
        data: { status: "NEGOTIATING" },
      });

      // Create ContractStatusLog
      await tx.contractStatusLog.create({
        data: {
          contractId,
          oldStatus: "SENT_TO_CUSTOMER",
          newStatus: "NEGOTIATING",
          note: `Khách hàng yêu cầu chỉnh sửa hợp đồng: ${trimmedReason}`,
          changedBy: null, // TODO(Phase 7): populate from session
        },
      });
    });

    return {
      success: true,
      message: "Yêu cầu chỉnh sửa đã được gửi. GreenPeat sẽ liên hệ lại với Quý khách.",
    };
  } catch (err) {
    console.error("[rejectContractSignature]", err);
    return {
      success: false,
      error: "Lỗi hệ thống khi xử lý yêu cầu. Vui lòng thử lại hoặc liên hệ GreenPeat.",
    };
  }
}

