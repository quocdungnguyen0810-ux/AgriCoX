"use client";

import { useState, useTransition } from "react";
import { 
  FileCheck, 
  Package, 
  Truck, 
  Warehouse, 
  ClipboardCheck, 
  Download, 
  CheckCircle2, 
  Clock,
  Plus,
  Loader2,
  FileText,
  ShieldCheck,
  Zap,
  Eye
} from "lucide-react";
import { createAndFinalizeDoc } from "@/app/admin/actions/smart-docs";
import { useRouter } from "next/navigation";

interface GeneratedDoc {
  id: string;
  documentType: string;
  status: string;
  fileName: string;
  fileUrl: string;
}

interface OrderData {
  id: string;
  orderCode: string;
  status: string;
}

export default function LogisticsDocPanel({ 
  order, 
  generatedDocs 
}: { 
  order: OrderData;
  generatedDocs: GeneratedDoc[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const LOGISTICS_DOCS = [
    { type: 'QUALITY_CERTIFICATE', label: 'Chứng nhận Chất lượng (QC)', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { type: 'PACKING_LIST', label: 'Phiếu đóng gói (Packing List)', icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { type: 'WAREHOUSE_RELEASE', label: 'Phiếu xuất kho (Gate Pass)', icon: Warehouse, color: 'text-orange-500', bg: 'bg-orange-50' },
    { type: 'DELIVERY_CONFIRMATION', label: 'Biên bản giao nhận (Delivery)', icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const handleOpenModal = (type: string) => {
    // Set default data based on type
    const defaults: any = {};
    if (type === 'QUALITY_CERTIFICATE') {
      defaults.moisture = "13.5%";
      defaults.germination = "98%";
      defaults.purity = "99.9%";
      defaults.inspector = "QA Dept";
    } else if (type === 'PACKING_LIST') {
      defaults.totalPackages = "500 Bags";
      defaults.netWeight = "25,000 KGS";
      defaults.grossWeight = "25,150 KGS";
    }
    setFormData(defaults);
    setActiveModal(type);
  };

  const handleFinalize = () => {
    if (!activeModal) return;
    startTransition(async () => {
      const res = await createAndFinalizeDoc('ORDER', order.id, activeModal as any, formData);
      if (res.success) {
        setActiveModal(null);
        router.refresh();
      } else {
        alert(res.error.message);
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-indigo-500" />
            Hồ sơ Logistics & Kiểm định
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Quản lý và cấp phát chứng từ vận hành</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <Zap size={12} className="text-yellow-400" /> Auto-Generated
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {LOGISTICS_DOCS.map((doc) => {
          const existing = generatedDocs.find(d => d.documentType === doc.type);
          return (
            <div 
              key={doc.type}
              className={`p-4 rounded-2xl border transition-all ${existing ? 'bg-white border-gray-100' : 'bg-gray-50/30 border-dashed border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${doc.bg} ${doc.color}`}>
                  <doc.icon size={20} />
                </div>
                {existing ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                    <CheckCircle2 size={10} /> Đã cấp
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full uppercase">
                    <Clock size={10} /> Chờ tạo
                  </span>
                )}
              </div>
              
              <h4 className="text-sm font-bold text-gray-700 mb-1">{doc.label}</h4>
              <p className="text-[11px] text-gray-400 mb-4 line-clamp-1">
                {existing ? `Mã: ${existing.fileName}` : "Chưa có thông tin hồ sơ cho khâu này."}
              </p>

              <div className="flex items-center gap-2">
                {existing ? (
                  <a 
                    href={existing.fileUrl} 
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Download size={14} /> Xem & Tải
                  </a>
                ) : (
                  <div className="flex flex-col gap-2 w-full">
                    <a 
                      href={`/api/orders/${order.id}/step-pdf?type=${doc.type}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-[11px] font-bold hover:bg-gray-200 transition-colors"
                    >
                      <Eye size={12} /> Xem bản thảo
                    </a>
                    <button 
                      onClick={() => handleOpenModal(doc.type)}
                      className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-800 text-white text-xs font-bold hover:bg-gray-900 transition-colors shadow-md shadow-gray-200"
                    >
                      <Plus size={14} /> Chốt & Xuất PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for editing document data before finalizing */}
      {activeModal && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">
                Cấp phát: {LOGISTICS_DOCS.find(d => d.type === activeModal)?.label}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {activeModal === 'QUALITY_CERTIFICATE' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Người kiểm định</label>
                    <input 
                      type="text" 
                      value={formData.inspector}
                      onChange={e => setFormData({...formData, inspector: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Độ ẩm (%)</label>
                    <input 
                      type="text" 
                      value={formData.moisture}
                      onChange={e => setFormData({...formData, moisture: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Tỷ lệ nảy mầm</label>
                    <input 
                      type="text" 
                      value={formData.germination}
                      onChange={e => setFormData({...formData, germination: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
              )}

              {activeModal === 'PACKING_LIST' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Số lượng kiện / bao</label>
                    <input 
                      type="text" 
                      value={formData.totalPackages}
                      onChange={e => setFormData({...formData, totalPackages: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Trọng lượng Tịnh (Net)</label>
                      <input 
                        type="text" 
                        value={formData.netWeight}
                        onChange={e => setFormData({...formData, netWeight: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Trọng lượng Tổng (Gross)</label>
                      <input 
                        type="text" 
                        value={formData.grossWeight}
                        onChange={e => setFormData({...formData, grossWeight: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <ShieldCheck size={20} className="text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-700">
                  Chứng từ sẽ được hệ thống tự động sinh dựa trên dữ liệu bạn vừa nhập kết hợp với thông tin đơn hàng hiện tại. Sau khi chốt, hồ sơ sẽ không thể sửa đổi để đảm bảo tính pháp lý.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-white transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleFinalize}
                disabled={isPending}
                className="px-8 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-900 transition-all flex items-center gap-2 shadow-lg shadow-gray-200 disabled:opacity-50"
              >
                {isPending ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Chốt hồ sơ & Xuất PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
