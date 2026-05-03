"use client";

import { useState, useTransition } from "react";
import { createDeliveryNote } from "@/app/admin/actions/logistics";
import { Loader2, Truck, Plus, X } from "lucide-react";

export function CreateDeliveryModal({ orderId }: { orderId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState("");
  const [driver, setDriver] = useState("");
  const [license, setLicense] = useState("");
  const [tracking, setTracking] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createDeliveryNote(orderId, company, driver, license, tracking);
      if (res.success) {
        setIsOpen(false);
      } else {
        setError(res.error || "Lỗi không xác định");
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 flex items-center gap-1.5 font-medium transition-colors"
      >
        <Truck size={14} /> Giao hàng
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-orange-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Truck className="text-orange-500" size={18} />
                Tạo Biên bản Giao nhận
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Đơn vị vận chuyển</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="VD: Viettel Post, Xe cẩu anh Tâm..."
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Biển số xe</label>
                  <input
                    type="text"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="VD: 51H-123.45"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Tên tài xế</label>
                  <input
                    type="text"
                    value={driver}
                    onChange={(e) => setDriver(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mã Tracking (Nếu có)</label>
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="VD: VTP123456789"
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 text-sm text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Sinh Biên bản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
