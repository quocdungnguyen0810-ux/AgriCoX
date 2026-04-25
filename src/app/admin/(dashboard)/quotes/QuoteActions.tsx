"use client";

import { useState, useTransition } from "react";
import { updateQuoteStatus, assignQuoteToSales, convertQuoteToOrder, deleteQuote } from "@/app/admin/actions";
import { ArrowRightCircle, UserCheck, Trash2, Loader2, ShoppingCart } from "lucide-react";

interface QuoteActionsProps {
  quoteId: string;
  currentStatus: string;
  assigneeId: string | null;
  assigneeName?: string | null;
  salesUsers: { id: string; name: string; role: string }[];
}

const nextStatusMap: Record<string, { label: string; status: string; color: string }[]> = {
  NEW: [
    { label: "Bắt đầu xử lý", status: "IN_PROGRESS", color: "bg-orange-500 hover:bg-orange-600" },
  ],
  ASSIGNED: [
    { label: "Bắt đầu xử lý", status: "IN_PROGRESS", color: "bg-orange-500 hover:bg-orange-600" },
  ],
  IN_PROGRESS: [
    { label: "Đã báo giá", status: "QUOTED", color: "bg-green-500 hover:bg-green-600" },
  ],
  QUOTED: [
    { label: "KH chấp nhận", status: "ACCEPTED", color: "bg-emerald-500 hover:bg-emerald-600" },
    { label: "KH từ chối", status: "REJECTED", color: "bg-red-500 hover:bg-red-600" },
  ],
  ACCEPTED: [
    { label: "Chuyển đơn hàng", status: "CONVERT", color: "bg-purple-500 hover:bg-purple-600" },
  ],
};

export function QuoteActions({ quoteId, currentStatus, assigneeId, assigneeName, salesUsers }: QuoteActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showAssign, setShowAssign] = useState(false);
  const [convertResult, setConvertResult] = useState<string | null>(null);

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "CONVERT") {
      startTransition(async () => {
        const result = await convertQuoteToOrder(quoteId, {});
        setConvertResult(result.orderCode);
      });
      return;
    }
    startTransition(() => {
      updateQuoteStatus(quoteId, newStatus);
    });
  };

  const handleAssign = (userId: string) => {
    startTransition(() => {
      assignQuoteToSales(quoteId, userId);
    });
    setShowAssign(false);
  };

  const handleDelete = () => {
    if (confirm("Xác nhận xóa yêu cầu báo giá này?")) {
      startTransition(() => {
        deleteQuote(quoteId);
      });
    }
  };

  if (currentStatus === "CONVERTED") {
    return (
      <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg">
        <ShoppingCart size={16} />
        <span className="font-medium">
          {convertResult ? `Đã tạo đơn ${convertResult}` : "Đã chuyển thành đơn hàng"}
        </span>
      </div>
    );
  }

  if (currentStatus === "REJECTED") {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-red-500">Đã từ chối</span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
        >
          <Trash2 size={14} /> Xóa
        </button>
      </div>
    );
  }

  const actions = nextStatusMap[currentStatus] || [];

  return (
    <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Assign button */}
        {!assigneeId && currentStatus !== "CONVERTED" && (
          <div className="relative">
            <button
              onClick={() => setShowAssign(!showAssign)}
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1.5 font-medium"
            >
              <UserCheck size={14} /> Giao cho Sales
            </button>
            {showAssign && (
              <div className="absolute top-full left-0 mt-1 bg-white shadow-xl rounded-xl border border-gray-200 py-1 z-10 min-w-[180px]">
                {salesUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleAssign(u.id)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{u.name}</span>
                    <span className="text-xs text-gray-400">{u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {assigneeName && (
          <span className="text-xs text-gray-400">
            Phụ trách: <span className="font-medium text-gray-600">{assigneeName}</span>
          </span>
        )}

        {/* Status actions */}
        {actions.map((action) => (
          <button
            key={action.status}
            onClick={() => handleStatusChange(action.status)}
            disabled={isPending}
            className={`text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1.5 font-medium disabled:opacity-50 ${action.color}`}
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowRightCircle size={14} />
            )}
            {action.label}
          </button>
        ))}

        {convertResult && (
          <span className="text-xs text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded">
            ✅ Đã tạo đơn {convertResult}
          </span>
        )}
      </div>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 disabled:opacity-50"
      >
        <Trash2 size={14} /> Xóa
      </button>
    </div>
  );
}
