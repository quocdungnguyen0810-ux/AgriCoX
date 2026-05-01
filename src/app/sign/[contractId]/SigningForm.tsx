"use client";

/**
 * SigningForm — TYPE_NAME signature form for the public signing page.
 *
 * Allows the signer to type their full name, confirm consent, and submit.
 * After successful submission, shows a success message and prevents re-submission.
 *
 * TODO(Phase 5B.12): Add draw signature canvas and upload signature image tabs.
 */

import { useState, useTransition } from "react";
import { submitTypedSignature, rejectContractSignature } from "../actions";
import {
  Type,
  PenLine,
  Upload,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  MessageSquareWarning,
  Send,
} from "lucide-react";

interface SigningFormProps {
  contractId: string;
  rawToken: string;
  signerName: string;
  signerRole: string;
}

export default function SigningForm({
  contractId,
  rawToken,
  signerName,
  signerRole,
}: SigningFormProps) {
  const [typedName, setTypedName] = useState(signerName || "");
  const [consent, setConsent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    type?: "sign" | "reject";
  } | null>(null);

  // Rejection state
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const roleName = signerRole === "CUSTOMER" ? "Khách hàng" : "Đại diện GreenPeat";

  const canSubmit =
    typedName.trim().length >= 2 && consent && !isPending && !result?.success;

  const canReject =
    rejectReason.trim().length >= 5 && !isPending && !result?.success;

  function handleSubmit() {
    if (!canSubmit) return;

    startTransition(async () => {
      const res = await submitTypedSignature(
        contractId,
        rawToken,
        typedName.trim(),
        consent
      );
      setResult({
        success: res.success,
        message: res.success ? res.message : res.error,
        type: "sign",
      });
    });
  }

  function handleReject() {
    if (!canReject) return;

    startTransition(async () => {
      const res = await rejectContractSignature(
        contractId,
        rawToken,
        rejectReason.trim()
      );
      setResult({
        success: res.success,
        message: res.success ? res.message : res.error,
        type: "reject",
      });
    });
  }

  // ── Success State: Signing ──
  if (result?.success && result.type === "sign") {
    return (
      <div className="bg-white rounded-2xl border-2 border-green-300 shadow-sm p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="text-green-600" size={36} />
          </div>
          <h2 className="text-lg font-bold text-green-800 mb-2">
            Ký hợp đồng thành công!
          </h2>
          <p className="text-sm text-gray-600 mb-4">{result.message}</p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <p className="text-xs text-green-700">
              <strong>Người ký:</strong> {typedName}
            </p>
            <p className="text-xs text-green-700 mt-1">
              <strong>Vai trò:</strong> {roleName}
            </p>
            <p className="text-xs text-green-700 mt-1">
              <strong>Phương thức:</strong> Chữ ký nhập tên
            </p>
            <p className="text-xs text-green-700 mt-1">
              <strong>Thời gian:</strong>{" "}
              {new Date().toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Bạn có thể đóng trang này. GreenPeat sẽ liên hệ với bạn về các bước tiếp theo.
          </p>
        </div>
      </div>
    );
  }

  // ── Success State: Rejection ──
  if (result?.success && result.type === "reject") {
    return (
      <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-50 flex items-center justify-center">
            <MessageSquareWarning className="text-amber-600" size={36} />
          </div>
          <h2 className="text-lg font-bold text-amber-800 mb-2">
            Yêu cầu chỉnh sửa đã được gửi
          </h2>
          <p className="text-sm text-gray-600 mb-4">{result.message}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
            <p className="text-xs text-amber-700">
              <strong>Lý do:</strong> {rejectReason}
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Bạn có thể đóng trang này. GreenPeat sẽ liên hệ lại với Quý khách.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-green-200 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="text-green-600" size={18} />
        <h2 className="text-sm font-bold text-green-700 uppercase tracking-wide">
          Ký hợp đồng
        </h2>
      </div>

      {/* ── Error Alert ── */}
      {result && !result.success && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-start gap-2">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-red-700">{result.message}</p>
        </div>
      )}

      {/* ── Signing Methods ── */}
      <p className="text-sm text-gray-600 mb-3">
        Chọn phương thức ký hợp đồng:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* TYPE_NAME — Active */}
        <div className="rounded-xl border-2 border-green-400 bg-green-50 p-4 text-center ring-2 ring-green-200">
          <Type
            size={24}
            className="text-green-600 mx-auto mb-2"
          />
          <p className="text-sm font-semibold text-green-800">Nhập họ tên</p>
          <p className="text-xs text-green-600 mt-1">Đang sử dụng</p>
        </div>

        {/* DRAW — Disabled placeholder */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center opacity-50 cursor-not-allowed">
          <PenLine size={24} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">Vẽ chữ ký</p>
          <p className="text-xs text-gray-400 mt-1">Sắp ra mắt</p>
        </div>

        {/* UPLOAD — Disabled placeholder */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center opacity-50 cursor-not-allowed">
          <Upload size={24} className="text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-500">Tải ảnh chữ ký</p>
          <p className="text-xs text-gray-400 mt-1">Sắp ra mắt</p>
        </div>
      </div>

      {/* ── TYPE_NAME Form ── */}
      <div className="space-y-4">
        {/* Name input */}
        <div>
          <label
            htmlFor="typed-signature"
            className="block text-sm font-semibold text-gray-700 mb-1"
          >
            Họ và tên người ký
          </label>
          <input
            id="typed-signature"
            type="text"
            value={typedName}
            onChange={(e) => {
              setTypedName(e.target.value);
              if (result) setResult(null); // Clear previous error
            }}
            placeholder="Nhập họ và tên đầy đủ"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            disabled={isPending}
            autoComplete="name"
          />
          {typedName.length > 0 && typedName.trim().length < 2 && (
            <p className="text-xs text-red-500 mt-1">Tối thiểu 2 ký tự.</p>
          )}
        </div>

        {/* Signature preview */}
        {typedName.trim().length >= 2 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
              Xem trước chữ ký
            </p>
            <p
              className="text-2xl text-gray-800"
              style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
            >
              {typedName.trim()}
            </p>
          </div>
        )}

        {/* Consent checkbox */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              if (result) setResult(null);
            }}
            disabled={isPending}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">
            Tôi xác nhận đã đọc, hiểu và đồng ý với nội dung hợp đồng này.
          </span>
        </label>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            canSubmit
              ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              Xác nhận ký hợp đồng
            </>
          )}
        </button>
      </div>

      {/* ── Customer Rejection Section (only for CUSTOMER) ── */}
      {signerRole === "CUSTOMER" && (
        <div className="mt-5 pt-5 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setShowRejectForm(!showRejectForm)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 transition-colors"
          >
            <MessageSquareWarning size={16} />
            {showRejectForm ? "Ẩn" : "Yêu cầu chỉnh sửa hợp đồng"}
          </button>

          {showRejectForm && (
            <div className="mt-3 space-y-3">
              <div>
                <label
                  htmlFor="reject-reason"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Lý do yêu cầu chỉnh sửa
                </label>
                <textarea
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (result) setResult(null);
                  }}
                  placeholder="Mô tả nội dung cần chỉnh sửa (tối thiểu 5 ký tự)..."
                  rows={3}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors resize-none"
                />
                {rejectReason.length > 0 && rejectReason.trim().length < 5 && (
                  <p className="text-xs text-red-500 mt-1">
                    Tối thiểu 5 ký tự.
                  </p>
                )}
              </div>

              <button
                onClick={handleReject}
                disabled={!canReject}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  canReject
                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Yêu cầu chỉnh sửa hợp đồng
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
