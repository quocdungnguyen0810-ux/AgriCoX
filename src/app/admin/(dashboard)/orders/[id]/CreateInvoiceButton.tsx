"use client";

import { useTransition, useState } from "react";
import { createInvoice } from "@/app/admin/actions/accounting";
import { Loader2, FileText } from "lucide-react";

export function CreateInvoiceButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const res = await createInvoice(orderId);
      if (!res.success) {
        setError(res.error || "Lỗi tạo hoá đơn");
      }
    });
  };

  return (
    <div className="inline-block">
      {error && <span className="text-red-500 text-xs mr-2">{error}</span>}
      <button
        onClick={handleCreate}
        disabled={isPending}
        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5 font-medium transition-colors"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
        Xuất Hoá đơn
      </button>
    </div>
  );
}
