"use client";

import { useState, useTransition } from "react";
import { createSigningLink } from "@/app/admin/actions";
import { Link2, Copy, CheckCircle, Loader2, AlertCircle } from "lucide-react";

interface SigningLinkGeneratorProps {
  contractId: string;
  currentStatus: string;
}

export function SigningLinkGenerator({ contractId, currentStatus }: SigningLinkGeneratorProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [signingData, setSigningData] = useState<{ url: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const signerRole = currentStatus === "SENT_TO_CUSTOMER" ? "CUSTOMER" : "GREENPEAT_SIGNER";
  const buttonLabel = signerRole === "CUSTOMER" ? "Tạo link ký cho Khách hàng" : "Tạo link ký nội bộ (GreenPeat)";

  const handleGenerate = () => {
    setError(null);
    setSigningData(null);
    setCopied(false);

    startTransition(async () => {
      const result = await createSigningLink(contractId, signerRole);
      if (result.success && result.data) {
        setSigningData({
          url: result.data.signingUrl,
          expiresAt: result.data.expiresAt,
        });
      } else {
        setError(!result.success ? result.error.message : "Lỗi tạo link ký.");
      }
    });
  };

  const handleCopy = async () => {
    if (!signingData) return;
    try {
      await navigator.clipboard.writeText(signingData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide flex items-center gap-2">
        <Link2 size={16} /> Tạo Link Ký Hợp Đồng
      </h3>

      {!signingData ? (
        <div>
          <p className="text-sm text-gray-500 mb-4">
            {signerRole === "CUSTOMER" 
              ? "Hợp đồng đã được gửi cho khách. Bạn có thể tạo link ký điện tử để khách hàng truy cập và xác nhận."
              : "Khách hàng đã ký hợp đồng. Vui lòng tạo link ký nội bộ để đại diện GreenPeat hoàn tất chữ ký cuối cùng."}
          </p>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}
            {buttonLabel}
          </button>
          {error && (
            <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 text-green-800 p-3 rounded-xl border border-green-200 text-sm">
            <p className="font-semibold mb-1">✅ Tạo link thành công!</p>
            <p>Vui lòng copy đường link dưới đây và gửi cho người ký. Link này chứa mã bảo mật và sẽ hết hạn vào <strong>{new Date(signingData.expiresAt).toLocaleString("vi-VN")}</strong>.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={signingData.url}
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 font-semibold text-sm transition-colors"
            >
              {copied ? <CheckCircle size={16} className="text-green-400" /> : <Copy size={16} />}
              {copied ? "Đã copy" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
