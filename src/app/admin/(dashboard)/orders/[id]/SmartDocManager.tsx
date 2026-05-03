"use client";

import { useState, useTransition } from "react";
import { 
  createDocDraft, 
  updateDocDraft, 
  finalizeDoc 
} from "@/app/admin/actions/smart-docs";
import {
  FileText,
  Edit,
  CheckCircle2,
  Plus,
  Loader2,
  FilePlus2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";

interface SmartDocManagerProps {
  entityId: string;
  entityType: 'ORDER' | 'CONTRACT';
  existingDocs: any[];
  defaultValues: {
    orderCode: string;
    customerName: string;
    deliveryAddress: string;
    assigneeName: string;
  };
}

const DOC_TEMPLATES = [
  { type: 'PROFORMA_INVOICE', label: 'Proforma Invoice (PI)', icon: FileText },
  { type: 'PHYTOSANITARY', label: 'Giấy kiểm dịch thực vật', icon: ShieldCheck },
  { type: 'CERTIFICATE_ORIGIN', label: 'Chứng nhận xuất xứ (C/O)', icon: ClipboardList },
  { type: 'CONTRACT_LIQUIDATION', label: 'Thanh lý hợp đồng', icon: CheckCircle2 },
];

export function SmartDocManager({ 
  entityId, 
  entityType, 
  existingDocs,
  defaultValues 
}: SmartDocManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const handleCreateDraft = (type: string) => {
    startTransition(async () => {
      const res = await createDocDraft(entityType, entityId, type as any, defaultValues);
      if (res.success) {
        // Automatically open editor for new draft
        const newDoc = { id: res.data.id, documentType: type, dataJson: JSON.stringify(defaultValues) };
        openEditor(newDoc);
      }
    });
  };

  const openEditor = (doc: any) => {
    setEditingDoc(doc);
    setFormData(JSON.parse(doc.dataJson));
  };

  const handleUpdate = () => {
    startTransition(async () => {
      await updateDocDraft(editingDoc.id, formData);
      setEditingDoc(null);
    });
  };

  const handleFinalize = (docId: string) => {
    if (!confirm("Bạn có chắc chắn muốn chốt chứng từ này? Sau khi chốt sẽ không thể chỉnh sửa.")) return;
    startTransition(async () => {
      await finalizeDoc(docId);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          <FilePlus2 size={16} className="text-indigo-500" /> Hồ sơ nghiệp vụ thông minh
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Templates Area */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Khởi tạo chứng từ mới</label>
          <div className="grid grid-cols-1 gap-2">
            {DOC_TEMPLATES.map((tpl) => (
              <button
                key={tpl.type}
                onClick={() => handleCreateDraft(tpl.type)}
                disabled={isPending}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-indigo-50 hover:border-indigo-100 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white shadow-sm group-hover:text-indigo-600">
                    <tpl.icon size={16} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{tpl.label}</span>
                </div>
                <Plus size={14} className="text-gray-300 group-hover:text-indigo-400" />
              </button>
            ))}
          </div>
        </div>

        {/* List Area */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase">Danh sách hồ sơ đang xử lý</label>
          {existingDocs.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl text-gray-300">
              <FilePlus2 size={24} className="mb-2 opacity-20" />
              <span className="text-[10px]">Chưa có chứng từ nào</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {existingDocs.map((doc) => (
                <div key={doc.id} className={`p-3 rounded-xl border ${doc.status === 'DRAFT' ? 'border-amber-100 bg-amber-50/30' : 'border-emerald-100 bg-emerald-50/30'} flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${doc.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {doc.status}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-gray-800">{doc.documentType.replace('_', ' ')}</div>
                      <div className="text-[8px] text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {doc.status === 'DRAFT' ? (
                      <>
                        <button 
                          onClick={() => openEditor(doc)}
                          className="p-1.5 rounded-lg bg-white shadow-sm text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleFinalize(doc.id)}
                          className="p-1.5 rounded-lg bg-white shadow-sm text-gray-500 hover:text-emerald-600 transition-colors"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      </>
                    ) : (
                      <a 
                        href={doc.fileUrl} 
                        target="_blank" 
                        className="p-1.5 rounded-lg bg-white shadow-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal Overlay */}
      {editingDoc && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Chỉnh sửa chứng từ</h2>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{editingDoc.documentType}</p>
              </div>
              <button onClick={() => setEditingDoc(null)} className="p-2 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-8 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Mã tham chiếu</label>
                  <input 
                    type="text" 
                    value={formData.orderCode} 
                    onChange={e => setFormData({...formData, orderCode: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Tên khách hàng</label>
                  <input 
                    type="text" 
                    value={formData.customerName} 
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Địa điểm giao hàng / Xuất xứ</label>
                <input 
                  type="text" 
                  value={formData.deliveryAddress} 
                  onChange={e => setFormData({...formData, deliveryAddress: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Người phụ trách</label>
                  <input 
                    type="text" 
                    value={formData.assigneeName} 
                    onChange={e => setFormData({...formData, assigneeName: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Tiêu chuẩn kỹ thuật</label>
                  <input 
                    type="text" 
                    value={formData.standard} 
                    onChange={e => setFormData({...formData, standard: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 block mb-1">Ghi chú bổ sung</label>
                <textarea 
                  rows={3}
                  value={formData.notes || ''} 
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400 transition-all"
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button 
                onClick={() => setEditingDoc(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleUpdate}
                disabled={isPending}
                className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 size={16} className="animate-spin" />}
                Lưu bản nháp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
