"use client";

import { useState, useTransition } from "react";
import { uploadDocument } from "@/app/admin/actions/logistics";
import { Loader2, Paperclip, Plus, X } from "lucide-react";

export function UploadDocumentModal({ orderId }: { orderId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("CO");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Vui lòng chọn file");
      return;
    }
    setError(null);

    // Bắt đầu upload
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("subFolder", "documents");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Upload file thất bại");
        const { fileUrl } = await uploadRes.json();

        // Gọi action lưu DB
        const res = await uploadDocument(orderId, type, file.name, fileUrl, note);
        if (res.success) {
          setIsOpen(false);
          setFile(null);
          setNote("");
        } else {
          setError(res.error || "Lỗi lưu tài liệu");
        }
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700 flex items-center gap-1.5 font-medium transition-colors"
      >
        <Paperclip size={14} /> Upload Chứng từ
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Paperclip className="text-gray-500" size={18} />
                Upload Chứng từ (CQ/CO/BL)
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-2 bg-red-50 text-red-600 text-xs rounded-lg">{error}</div>}

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Loại chứng từ</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none"
                >
                  <option value="CO">Giấy chứng nhận xuất xứ (C/O)</option>
                  <option value="CQ">Giấy chứng nhận chất lượng (C/Q)</option>
                  <option value="BL">Vận đơn (Bill of Lading)</option>
                  <option value="PHYTOSANITARY">Giấy chứng nhận Kiểm dịch thực vật</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">File (PDF/Image)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Ghi chú (Tuỳ chọn)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="VD: C/O Form E..."
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none"
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
                  disabled={isPending || !file}
                  className="px-4 py-2 text-sm text-white bg-gray-800 hover:bg-black rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Tải lên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
