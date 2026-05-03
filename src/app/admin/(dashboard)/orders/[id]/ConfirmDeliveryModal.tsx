"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Upload, Loader2, X, FileText, Camera } from "lucide-react";
import { confirmOrderDelivery } from "@/app/admin/actions/order";
import { useRouter } from "next/navigation";

export function ConfirmDeliveryModal({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("note", note || "Giao hàng thành công");
      if (file) formData.append("file", file);
      
      const res = await confirmOrderDelivery(formData);
      
      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        alert(res.error.message);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-100 transition-all active:scale-95"
      >
        <CheckCircle2 size={18} />
        Xác nhận Giao hàng Thành công
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                Hoàn tất Giao hàng
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-white text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Ghi chú xác nhận</label>
                <textarea 
                  placeholder="VD: Khách đã nhận đủ hàng, không khiếu nại..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-sm focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all resize-none h-24"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Tải lên minh chứng (POD)</label>
                <div className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-8 transition-all hover:border-emerald-300 hover:bg-emerald-50/30 text-center cursor-pointer">
                  <input 
                    type="file" 
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    {file ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <FileText size={24} />
                        </div>
                        <div className="text-sm font-bold text-gray-700">{file.name}</div>
                        <button onClick={() => setFile(null)} className="text-[10px] text-red-500 font-bold uppercase underline">Xóa file</button>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          <Camera size={24} />
                        </div>
                        <div className="text-sm font-bold text-gray-500">Kéo thả hoặc Click để chọn ảnh</div>
                        <div className="text-[10px] text-gray-400">Định dạng: JPG, PNG, PDF (Max 5MB)</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex items-center gap-3">
              <button 
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-white transition-colors border border-transparent hover:border-gray-100"
              >
                Đóng
              </button>
              <button 
                onClick={handleConfirm}
                disabled={isPending || (!file && !confirm("Tiếp tục mà không có file minh chứng?"))}
                className="flex-[2] py-3 rounded-2xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-50"
              >
                {isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                Xác nhận & Chốt đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
