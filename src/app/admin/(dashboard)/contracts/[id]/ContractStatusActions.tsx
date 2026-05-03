"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContractStatus } from "@/app/admin/actions";
import {
  Send,
  MessageSquare,
  PenLine,
  CheckCircle2,
  Shield,
  Zap,
  Trophy,
  XCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Truck,
  FileText,
  CreditCard,
} from "lucide-react";

/**
 * Button config for each possible contract status transition.
 * Maps "fromStatus→toStatus" to label, color, and icon.
 */
const TRANSITION_BUTTONS: Record<
  string,
  { label: string; color: string; icon: React.ElementType; confirm?: string }
> = {
  // DRAFT
  "DRAFT→SENT_TO_CUSTOMER": {
    label: "Gửi cho khách hàng",
    color: "bg-blue-600 hover:bg-blue-700 text-white",
    icon: Send,
  },
  "DRAFT→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
    confirm: "Bạn chắc chắn muốn hủy hợp đồng này?",
  },
  // SENT_TO_CUSTOMER
  "SENT_TO_CUSTOMER→NEGOTIATING": {
    label: "Khách yêu cầu sửa",
    color: "bg-amber-500 hover:bg-amber-600 text-white",
    icon: MessageSquare,
  },
  "SENT_TO_CUSTOMER→SIGNED_BY_CUSTOMER": {
    label: "Khách đã ký",
    color: "bg-purple-600 hover:bg-purple-700 text-white",
    icon: PenLine,
  },
  "SENT_TO_CUSTOMER→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
    confirm: "Bạn chắc chắn muốn hủy hợp đồng này?",
  },
  // NEGOTIATING
  "NEGOTIATING→DRAFT": {
    label: "Sửa lại hợp đồng",
    color: "bg-gray-600 hover:bg-gray-700 text-white",
    icon: PenLine,
  },
  "NEGOTIATING→SENT_TO_CUSTOMER": {
    label: "Gửi lại cho khách hàng",
    color: "bg-blue-600 hover:bg-blue-700 text-white",
    icon: Send,
  },
  "NEGOTIATING→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
    confirm: "Bạn chắc chắn muốn hủy hợp đồng này?",
  },
  // SIGNED_BY_CUSTOMER
  "SIGNED_BY_CUSTOMER→SIGNED_BY_GREENPEAT": {
    label: "GreenPeat ký",
    color: "bg-indigo-600 hover:bg-indigo-700 text-white",
    icon: Shield,
  },
  "SIGNED_BY_CUSTOMER→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
    confirm: "Bạn chắc chắn muốn hủy hợp đồng này?",
  },
  // SIGNED_BY_GREENPEAT
  "SIGNED_BY_GREENPEAT→SIGNED": {
    label: "Xác nhận đã ký đầy đủ",
    color: "bg-green-600 hover:bg-green-700 text-white",
    icon: CheckCircle2,
  },
  "SIGNED_BY_GREENPEAT→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
    confirm: "Bạn chắc chắn muốn hủy hợp đồng này?",
  },
  // SIGNED
  "SIGNED→ACTIVE": {
    label: "Kích hoạt hợp đồng",
    color: "bg-emerald-600 hover:bg-emerald-700 text-white",
    icon: Zap,
  },
  // ACTIVE
  "ACTIVE→SHIPPING_LOGISTICS": {
    label: "Chuyển sang Giao vận & XNK",
    color: "bg-cyan-600 hover:bg-cyan-700 text-white",
    icon: Truck,
  },
  "ACTIVE→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
    confirm: "Bạn chắc chắn muốn hủy hợp đồng đang hiệu lực?",
  },
  // SHIPPING_LOGISTICS
  "SHIPPING_LOGISTICS→TAX_SETTLEMENT": {
    label: "Chuyển sang Quyết toán thuế",
    color: "bg-orange-600 hover:bg-orange-700 text-white",
    icon: FileText,
  },
  "SHIPPING_LOGISTICS→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
    confirm: "Bạn chắc chắn muốn hủy hợp đồng trong giai đoạn vận chuyển?",
  },
  // TAX_SETTLEMENT
  "TAX_SETTLEMENT→ACCOUNTING_FINAL": {
    label: "Chuyển sang Kế toán quyết toán",
    color: "bg-rose-600 hover:bg-rose-700 text-white",
    icon: CreditCard,
  },
  "TAX_SETTLEMENT→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
    confirm: "Bạn chắc chắn muốn hủy hợp đồng?",
  },
  // ACCOUNTING_FINAL
  "ACCOUNTING_FINAL→COMPLETED": {
    label: "Hoàn tất & Đóng hợp đồng",
    color: "bg-green-700 hover:bg-green-800 text-white",
    icon: Trophy,
  },
  "ACCOUNTING_FINAL→CANCELLED": {
    label: "Hủy hợp đồng",
    color: "bg-red-500 hover:bg-red-600 text-white",
    icon: XCircle,
  },
};

interface ContractStatusActionsProps {
  contractId: string;
  currentStatus: string;
  allowedTransitions: string[];
}

export function ContractStatusActions({
  contractId,
  currentStatus,
  allowedTransitions,
}: ContractStatusActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");

  if (allowedTransitions.length === 0) return null;

  const handleTransition = (toStatus: string) => {
    const key = `${currentStatus}→${toStatus}`;
    const btn = TRANSITION_BUTTONS[key];

    // Confirm dialog for destructive actions
    if (btn?.confirm) {
      if (!window.confirm(btn.confirm)) return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateContractStatus(
        contractId,
        toStatus,
        note.trim() || undefined
      );

      if (result.success) {
        setSuccess(`Đã chuyển trạng thái thành công.`);
        setNote("");
        setNoteOpen(false);
        router.refresh();
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(result.error.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 tracking-wide">
        Thao tác trạng thái
      </h3>

      {/* Note input toggle */}
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setNoteOpen(!noteOpen)}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
        >
          {noteOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Ghi chú thay đổi trạng thái (tùy chọn)
        </button>
        {noteOpen && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú cho lần thay đổi trạng thái này..."
            rows={2}
            className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {allowedTransitions.map((toStatus) => {
          const key = `${currentStatus}→${toStatus}`;
          const btn = TRANSITION_BUTTONS[key];

          if (!btn) return null;

          const Icon = btn.icon;

          return (
            <button
              key={toStatus}
              onClick={() => handleTransition(toStatus)}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors ${btn.color}`}
            >
              {isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Icon size={14} />
              )}
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-600">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* TODO(Phase 5B.8): Generate signing tokens and secure signing links */}
      {/* TODO(Phase 5B.9): Create public customer signing page */}
      {/* TODO(Phase 5B.10): Create real ContractSignature records on sign actions */}
    </div>
  );
}
