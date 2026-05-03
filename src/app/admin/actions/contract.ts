"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { QuoteError, ActionResult, ok, fail } from "@/lib/quote-error";
import { canEditContract, validateContractTransition, isTerminalContractStatus, getContractStatusLabel } from "@/lib/contract-status";
import { validateOrderTransition } from "@/lib/order-status";
import { generateSigningToken, buildSigningUrl } from "@/lib/signing-token";
import { saveFileLocally } from "@/lib/local-storage";
import { safeUploadToDrive } from "@/lib/drive";
import { renderToStream } from "@react-pdf/renderer";
import { ContractPDFDocument } from "@/lib/pdf/ContractPDFDocument";
import { appendContractRow, appendDocumentRow } from "@/lib/sheets";
import { sanitizeFileName } from "@/lib/file-name";
import { calculateQuote, formatVND } from "@/lib/quote-calculation";
import React from "react";




/**
 * Generate a sequential Contract code: GP-CT-YYYY-NNNN
 * Must be called inside a transaction.
 */
async function generateContractCode(tx: any): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `GP-CT-${year}-`;

  const lastContract = await tx.contract.findFirst({
    where: { contractCode: { startsWith: prefix } },
    orderBy: { contractCode: "desc" },
    select: { contractCode: true },
  });

  let nextNum = 1;
  if (lastContract) {
    const parts = lastContract.contractCode.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${nextNum.toString().padStart(4, "0")}`;
}


/**
 * Create a Contract DRAFT from an existing Order.
 * 
 * - Idempotent: returns existing contract if order already has one.
 * - Snapshots order totals and terms into the legal record.
 * - Wrapped in $transaction for safety.
 */
export async function createContractFromOrder(
  orderId: string,
  createdBy: string
): Promise<ActionResult<{ contractId: string; contractCode: string; existing: boolean }>> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Check if Order exists and is eligible
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new QuoteError("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng");
      }

      if (!order.customerId) {
        throw new QuoteError("CUSTOMER_MISSING", "Đơn hàng thiếu thông tin khách hàng, không thể tạo hợp đồng");
      }

      // Allowed statuses for drafting: NEW, CONFIRMED
      const allowedStatuses = ["NEW", "CONFIRMED"];
      if (!allowedStatuses.includes(order.status)) {
        throw new QuoteError(
          "ORDER_NOT_READY_FOR_CONTRACT",
          `Đơn hàng đang ở trạng thái "${order.status}", không thể tạo bản thảo hợp đồng.`
        );
      }

      // 2. Idempotency: Return existing if already created
      const existing = await tx.contract.findUnique({
        where: { orderId },
        select: { id: true, contractCode: true },
      });

      if (existing) {
        return { contractId: existing.id, contractCode: existing.contractCode, existing: true };
      }

      // 3. Generate Code
      const contractCode = await generateContractCode(tx);

      // 4. Create Contract Record
      const contract = await tx.contract.create({
        data: {
          contractCode,
          orderId,
          rfqId: order.rfqId,
          quoteId: order.quoteId,
          customerId: order.customerId,
          locale: order.locale,
          currency: order.currency,
          totalAmount: order.totalAmount,
          paymentTerms: order.paymentTerms,
          deliveryTerms: order.deliveryTerms,
          contractDate: new Date(),
          status: "DRAFT",
          createdBy: createdBy || null,
          contentVi: `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n\nHỢP ĐỒNG MUA BÁN HÀNG HÓA\nSố: ${contractCode}\n\n[Bản thảo đang được chuẩn bị...]`,
          contentEn: `SOCIALIST REPUBLIC OF VIETNAM\nIndependence - Freedom - Happiness\n\nSALES CONTRACT\nNo: ${contractCode}\n\n[Draft is being prepared...]`,
          statusLogs: {
            create: {
              oldStatus: null,
              newStatus: "DRAFT",
              note: `Tạo bản thảo hợp đồng từ đơn hàng ${order.orderCode}`,
              changedBy: createdBy || null,
            },
          },
        },
      });

      return { contractId: contract.id, contractCode: contract.contractCode, existing: false };
    });

    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);
      revalidatePath("/admin/contracts");
      revalidatePath("/admin");
    } catch (e) {
      // revalidatePath might fail in non-Next environments (e.g. scripts), ignore it.
      console.warn("revalidatePath failed (expected in standalone scripts):", e instanceof Error ? e.message : e);
    }

    return ok(result);
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[createContractFromOrder]", err);
    return fail("CONTRACT_CREATE_FAILED", "Lỗi hệ thống khi tạo bản thảo hợp đồng");
  }
}


// ═══════════════════════════════════════════════════════
// CONTRACT ACTIONS
// ═══════════════════════════════════════════════════════

/**
 * Update editable contract fields (terms, dates, bilingual content).
 *
 * Rules:
 * - Only DRAFT or NEGOTIATING contracts can be edited.
 * - Does not change contract status.
 * - Does not touch Order or Quote.
 * - Does not generate documents.
 *
 * TODO(Phase 5B.7): Add contract status transition action.
 * TODO(Phase 5B.8): Add signing token generation.
 * TODO(Phase 6A): Generate contract PDF after content is finalized.
 */
export async function updateContractDetails(
  contractId: string,
  details: {
    contractDate?: string | null;
    effectiveDate?: string | null;
    expiryDate?: string | null;
    paymentTerms?: string | null;
    deliveryTerms?: string | null;
    incoterm?: string | null;
    deliveryLocation?: string | null;
    contentVi?: string | null;
    contentEn?: string | null;
  }
): Promise<ActionResult<{ updatedAt: string }>> {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { status: true },
    });

    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng");
    }

    if (!canEditContract(contract.status)) {
      return fail(
        "CONTRACT_NOT_EDITABLE",
        `Hợp đồng ở trạng thái "${contract.status}" không cho phép chỉnh sửa. Chỉ có thể sửa khi ở trạng thái Bản nháp hoặc Đang đàm phán.`
      );
    }

    // Parse dates safely — empty string or null → null
    const parseDate = (v: string | null | undefined): Date | null => {
      if (!v || v.trim() === "") return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    const updated = await prisma.contract.update({
      where: { id: contractId },
      data: {
        contractDate: parseDate(details.contractDate),
        effectiveDate: parseDate(details.effectiveDate),
        expiryDate: parseDate(details.expiryDate),
        paymentTerms: details.paymentTerms ?? null,
        deliveryTerms: details.deliveryTerms ?? null,
        incoterm: details.incoterm ?? null,
        deliveryLocation: details.deliveryLocation ?? null,
        contentVi: details.contentVi ?? null,
        contentEn: details.contentEn ?? null,
      },
      select: { updatedAt: true },
    });

    try {
      revalidatePath(`/admin/contracts/${contractId}`);
      revalidatePath("/admin/contracts");
    } catch {
      // Safe to ignore in non-Next environments
    }

    return ok({ updatedAt: updated.updatedAt.toISOString() });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[updateContractDetails]", err);
    return fail("CONTRACT_UPDATE_FAILED", "Lỗi hệ thống khi cập nhật hợp đồng");
  }
}

/**
 * Update Contract pricing by updating linked Order items and totals.
 */
export async function updateContractPricing(
  contractId: string,
  data: {
    items: { id: string; quantity: number; unitPrice: number; note?: string }[];
    shippingFee?: number;
    discountAmount?: number;
    vatRate?: number;
  }
): Promise<ActionResult<{ totalAmount: number }>> {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { order: { include: { items: true } } },
    });

    if (!contract) return fail("CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng");
    if (!contract.order) return fail("ORDER_NOT_FOUND", "Hợp đồng không liên kết với đơn hàng nào");
    if (!canEditContract(contract.status)) return fail("CONTRACT_NOT_EDITABLE", "Hợp đồng không thể chỉnh sửa ở trạng thái này");

    const order = contract.order;
    const currentVatRate = order.subtotal > order.discountAmount 
      ? order.vatAmount / (order.subtotal - order.discountAmount)
      : 0.08;

    const finalCalc = calculateQuote({
      items: data.items.map((i) => ({ quantity: i.quantity, unitPrice: i.unitPrice, discountRate: 0 })),
      discountAmount: data.discountAmount ?? order.discountAmount,
      shippingFee: data.shippingFee ?? order.shippingFee,
      vatRate: data.vatRate ?? currentVatRate,
    });

    await prisma.$transaction(async (tx) => {
      // 1. Update order items
      for (const item of data.items) {
        const idx = data.items.indexOf(item);
        await tx.orderItem.update({
          where: { id: item.id },
          data: {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: finalCalc.itemTotals[idx],
            note: item.note ?? null,
          },
        });
      }

      // 2. Update Order totals
      await tx.order.update({
        where: { id: order.id },
        data: {
          subtotal: finalCalc.subtotal,
          vatAmount: finalCalc.vatAmount,
          discountAmount: finalCalc.discountAmount,
          shippingFee: finalCalc.shippingFee,
          totalAmount: finalCalc.totalAmount,
        },
      });

      // 3. Update Contract total
      await tx.contract.update({
        where: { id: contractId },
        data: {
          totalAmount: finalCalc.totalAmount,
        },
      });
    });

    revalidatePath(`/admin/contracts/${contractId}`);
    revalidatePath(`/admin/orders/${order.id}`);
    return ok({ totalAmount: finalCalc.totalAmount });
  } catch (err) {
    console.error("[updateContractPricing]", err);
    return fail("CONTRACT_UPDATE_FAILED", "Lỗi khi cập nhật giá chốt hợp đồng");
  }
}


/**
 * Transition a Contract's status using the approved status machine.
 *
 * - Validates via validateContractTransition() from contract-status.ts.
 * - Creates ContractStatusLog for every successful transition.
 * - Side effect: When status becomes SIGNED and linked Order is NEW,
 *   upgrades Order to CONFIRMED.
 *
 * Does NOT: create signatures, generate PDF, upload to Drive, send email.
 *
 * TODO(Phase 5B.8): Generate signing tokens and secure signing links.
 * TODO(Phase 5B.9): Create public customer signing page.
 * TODO(Phase 5B.10): Create real ContractSignature records on sign actions.
 * TODO(Phase 6A): Generate contract PDF after SENT_TO_CUSTOMER or SIGNED.
 * TODO(Phase 6B): Upload contract PDFs to Google Drive.
 * TODO(Phase 6C): Sync contract status to Google Sheet CONTRACT_LOG.
 * TODO(Phase 7): Use authenticated session user as changedBy.
 * TODO(Phase 7): Add audit log and optimistic locking for contract edits/status.
 */
export async function updateContractStatus(
  contractId: string,
  newStatus: string,
  note?: string
): Promise<ActionResult<{ status: string; oldStatus: string }>> {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { status: true, orderId: true },
    });

    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng");
    }

    // Block if already terminal
    if (isTerminalContractStatus(contract.status)) {
      return fail(
        "INVALID_CONTRACT_TRANSITION",
        `Hợp đồng đã ở trạng thái kết thúc "${getContractStatusLabel(contract.status)}", không thể thay đổi.`
      );
    }

    // Validate transition via centralized status machine
    const transition = validateContractTransition(contract.status, newStatus);
    if (!transition.valid) {
      return fail("INVALID_CONTRACT_TRANSITION", transition.reason);
    }

    const oldStatus = contract.status;

    // Update contract status + create log atomically
    await prisma.$transaction(async (tx) => {
      // 1. Update status
      await tx.contract.update({
        where: { id: contractId },
        data: { status: newStatus },
      });

      // 2. Create status log
      await tx.contractStatusLog.create({
        data: {
          contractId,
          oldStatus,
          newStatus,
          note: note || `Cập nhật trạng thái từ "${getContractStatusLabel(oldStatus)}" sang "${getContractStatusLabel(newStatus)}"`,
          changedBy: null, // TODO(Phase 7): populate from session.user.id
        },
      });

      // 3. Side effect: SIGNED → confirm linked Order if NEW
      if (newStatus === "SIGNED" && contract.orderId) {
        const order = await tx.order.findUnique({
          where: { id: contract.orderId },
          select: { status: true },
        });

        if (order && order.status === "NEW") {
          // NEW → CONFIRMED is a valid transition in order-status.ts
          const orderTransition = validateOrderTransition(order.status, "CONFIRMED");
          if (orderTransition.valid) {
            await tx.order.update({
              where: { id: contract.orderId },
              data: { status: "CONFIRMED" },
            });
            await tx.orderStatusLog.create({
              data: {
                orderId: contract.orderId,
                oldStatus: order.status,
                newStatus: "CONFIRMED",
                note: `Tự động xác nhận do hợp đồng đã ký đầy đủ`,
                changedBy: null,
              },
            });
          }
        }
      }
    });

    // Sau khi đổi trạng thái, nếu chuyển sang COMPLETED, tự động tạo PDF và upload Drive/Sheet
    if (newStatus === "COMPLETED") {
      const fullContract = await prisma.contract.findUnique({
        where: { id: contractId },
        include: { customer: true, order: { include: { items: true } }, signatures: true }
      });
      if (fullContract) {
        let pdfUrl = "";
        let pdfFileName = "";
        try {
          const customerSignature = fullContract.signatures.find(s => s.signerRole === "CUSTOMER");
          const greenpeatSignature = fullContract.signatures.find(s => s.signerRole === "GREENPEAT_SIGNER");

          const stream = await renderToStream(
            React.createElement(ContractPDFDocument, {
              contract: fullContract as any,
              customerSignature: customerSignature as any,
              greenpeatSignature: greenpeatSignature as any
            }) as any
          );

          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.from(chunk));
          }
          const pdfBuffer = Buffer.concat(chunks);
          
          pdfFileName = sanitizeFileName(`${fullContract.contractCode || fullContract.id}.pdf`, "contract.pdf");
          const saveRes = await saveFileLocally(pdfBuffer, pdfFileName, "contracts");
          pdfUrl = saveRes.fileUrl;

          // Upload lên Google Drive
          const driveUrl = await safeUploadToDrive(pdfBuffer, pdfFileName, "CONTRACT");
          if (driveUrl) pdfUrl = driveUrl;

          await prisma.contract.update({
            where: { id: contractId },
            data: { signedFileUrl: pdfUrl }
          });
          await prisma.contractDocument.create({
            data: {
              contractId,
              documentType: "COMPLETED_CONTRACT_PDF",
              fileName: pdfFileName,
              fileUrl: pdfUrl,
              version: 1,
            },
          });
        } catch (pdfErr) {
          console.error("Lỗi khi sinh PDF Hợp Đồng (Admin):", pdfErr);
        }

        // Đồng bộ vào sheet Quản lý File
        if (pdfUrl) {
          appendDocumentRow([
            new Date().toISOString(),
            fullContract.contractCode || fullContract.id,
            "PDF Hợp đồng",
            pdfFileName,
            pdfUrl
          ]).catch(console.error);
        }

        appendContractRow([
          new Date().toLocaleString("vi-VN"), // Thời gian hoàn thành
          fullContract.contractCode || fullContract.id, // Mã HĐ
          fullContract.customer?.name || "Khách lẻ", // Tên khách
          fullContract.customer?.email || "", // Email
          fullContract.totalAmount.toString(), // Tổng tiền
          "Hoàn thành", // Trạng thái
          pdfUrl // Link PDF
        ]).catch(console.error);
      }
    }

    try {
      revalidatePath(`/admin/contracts/${contractId}`);
      revalidatePath("/admin/contracts");
      revalidatePath("/admin/orders");
      revalidatePath("/admin");
    } catch {
      // Safe to ignore in non-Next environments
    }

    return ok({ status: newStatus, oldStatus });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[updateContractStatus]", err);
    return fail("CONTRACT_UPDATE_FAILED", "Lỗi hệ thống khi cập nhật trạng thái hợp đồng");
  }
}


/**
 * Generate a secure signing link for a contract signer.
 *
 * Creates a ContractSignature record with a hashed token and returns
 * the signing URL containing the raw token. The raw token is NEVER stored.
 *
 * Eligibility:
 * - CUSTOMER: contract must be SENT_TO_CUSTOMER
 * - GREENPEAT_SIGNER: contract must be SIGNED_BY_CUSTOMER
 *
 * If a pending token already exists for the same role, it is revoked
 * and a new one is generated (the old raw token cannot be recovered).
 *
 * TODO(Phase 5B.9): Public signing page consumes this signingUrl.
 * TODO(Phase 5B.10): Signature submission records tokenUsedAt and signedAt.
 * TODO(Phase 6A): Generate signed contract PDF after both parties sign.
 * TODO(Phase 6B): Upload signed PDF to Google Drive.
 * TODO(Phase 6C): Sync signing state to Google Sheet.
 * TODO(Phase 7): Replace changedBy null with authenticated user id.
 * TODO(Phase 7): Add contract content versioning.
 */
export async function createSigningLink(
  contractId: string,
  signerRole: string,
  signerName?: string,
  signerEmail?: string
): Promise<ActionResult<{ signingUrl: string; expiresAt: string; signerRole: string }>> {
  try {
    // ── 1. Validate signer role ──
    const VALID_ROLES = ["CUSTOMER", "GREENPEAT_SIGNER"] as const;
    if (!VALID_ROLES.includes(signerRole as any)) {
      return fail(
        "INVALID_SIGNER_ROLE",
        `Vai trò ký "${signerRole}" không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(", ")}`
      );
    }

    // ── 2. Fetch contract with customer info ──
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: {
        id: true,
        status: true,
        customer: {
          select: { name: true, email: true, companyName: true },
        },
      },
    });

    if (!contract) {
      return fail("CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng");
    }

    // ── 3. Check contract eligibility by signer role ──
    const ROLE_STATUS_MAP: Record<string, string> = {
      CUSTOMER: "SENT_TO_CUSTOMER",
      GREENPEAT_SIGNER: "SIGNED_BY_CUSTOMER",
    };

    const requiredStatus = ROLE_STATUS_MAP[signerRole];
    if (contract.status !== requiredStatus) {
      const statusLabel = getContractStatusLabel(contract.status);
      const requiredLabel = getContractStatusLabel(requiredStatus);
      return fail(
        "CONTRACT_NOT_READY_FOR_SIGNING",
        `Hợp đồng đang ở trạng thái "${statusLabel}". Cần ở trạng thái "${requiredLabel}" để tạo liên kết ký cho ${signerRole === "CUSTOMER" ? "khách hàng" : "GreenPeat"}.`
      );
    }

    // ── 4. Revoke existing pending tokens for same role ──
    await prisma.contractSignature.updateMany({
      where: {
        contractId,
        signerRole,
        status: "PENDING",
        tokenUsedAt: null,
        tokenRevokedAt: null,
      },
      data: {
        tokenRevokedAt: new Date(),
        status: "EXPIRED",
      },
    });

    // ── 5. Generate secure token ──
    const { rawToken, tokenHash, expiresAt } = generateSigningToken();

    // ── 6. Resolve signer info ──
    let resolvedName = signerName || null;
    let resolvedEmail = signerEmail || null;
    let resolvedCompany: string | null = null;

    if (signerRole === "CUSTOMER") {
      resolvedName = resolvedName || contract.customer?.name || "Khách hàng";
      resolvedEmail = resolvedEmail || contract.customer?.email || null;
      resolvedCompany = contract.customer?.companyName || null;
    } else {
      resolvedName = resolvedName || "GreenPeat Representative";
    }

    // ── 7. Create ContractSignature + log atomically ──
    await prisma.$transaction(async (tx) => {
      await tx.contractSignature.create({
        data: {
          contractId,
          signerName: resolvedName!,
          signerEmail: resolvedEmail,
          signerRole,
          signerCompany: resolvedCompany,
          signingTokenHash: tokenHash,
          tokenExpiresAt: expiresAt,
          tokenUsedAt: null,
          tokenRevokedAt: null,
          signatureMethod: null,
          signatureImageUrl: null,
          signedAt: null,
          signingVersion: 1, // TODO(Phase 7): Add contract content versioning
          status: "PENDING",
        },
      });

      // Log the action (status does NOT change)
      await tx.contractStatusLog.create({
        data: {
          contractId,
          oldStatus: contract.status,
          newStatus: contract.status,
          note: `Tạo liên kết ký cho ${signerRole === "CUSTOMER" ? "khách hàng" : "GreenPeat"} (${resolvedName})`,
          changedBy: null, // TODO(Phase 7): populate from session
        },
      });
    });

    // ── 8. Build signing URL ──
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || undefined;
    const signingUrl = buildSigningUrl(contractId, rawToken, baseUrl);

    try {
      revalidatePath(`/admin/contracts/${contractId}`);
    } catch {
      // Safe to ignore in non-Next environments
    }

    return ok({
      signingUrl,
      expiresAt: expiresAt.toISOString(),
      signerRole,
    });
  } catch (err) {
    if (err instanceof QuoteError) return fail(err.code, err.message);
    console.error("[createSigningLink]", err);
    return fail("SIGNING_LINK_CREATE_FAILED", "Lỗi hệ thống khi tạo liên kết ký hợp đồng");
  }
}
