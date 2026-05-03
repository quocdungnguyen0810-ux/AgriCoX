"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, User, Search, UserPlus, Package, X, FileText } from "lucide-react";
import { createStandaloneQuoteWithItems } from "@/app/admin/actions/quote";
import { searchProducts } from "@/app/admin/actions/products";

interface Customer {
  id: string;
  name: string;
  companyName: string | null;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
}

interface CustomItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export function CreateQuoteButton({ customers, userId }: { customers: Customer[], userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newName, setNewName] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customDraft, setCustomDraft] = useState({ name: "", quantity: 1, unitPrice: 0, unit: "pcs" });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const handleProductSearch = async (q: string) => {
    setProductSearch(q);
    if (q.length > 1) {
      const res = await searchProducts(q);
      if (res.success) {
        setFoundProducts((res.data || []).map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          unit: p.unit,
        })));
      }
    } else {
      setFoundProducts([]);
    }
  };

  const addProduct = (product: Product) => {
    setSelectedProducts((prev) => prev.some((p) => p.id === product.id) ? prev : [...prev, product]);
    setProductSearch("");
    setFoundProducts([]);
  };

  const addCustomItem = () => {
    if (!customDraft.name.trim()) return;
    setCustomItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: customDraft.name.trim(),
        quantity: Math.max(1, customDraft.quantity || 1),
        unitPrice: Math.max(0, customDraft.unitPrice || 0),
        unit: customDraft.unit.trim() || "pcs",
      },
    ]);
    setCustomDraft({ name: "", quantity: 1, unitPrice: 0, unit: "pcs" });
  };

  const handleCreate = () => {
    if (mode === "existing" && !selectedCustomerId) {
      alert("Vui lòng chọn khách hàng.");
      return;
    }
    if (mode === "new" && !newName.trim()) {
      alert("Vui lòng nhập tên khách hàng.");
      return;
    }

    startTransition(async () => {
      const customerData = mode === "existing"
        ? { id: selectedCustomerId, name: "" }
        : { name: newName, companyName: newCompany, email: newEmail, phone: newPhone, address: newAddress };
      const res = await createStandaloneQuoteWithItems(
        customerData,
        userId,
        selectedProducts.map((p) => p.id),
        customItems.map(({ name, quantity, unitPrice, unit }) => ({ name, quantity, unitPrice, unit }))
      );
      if (res.success) {
        router.push(`/admin/quotes/${res.data.quoteId}`);
      } else {
        alert(res.error.message);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-white text-sm font-bold hover:bg-gray-900 transition-all shadow-lg shadow-gray-200"
      >
        <Plus size={16} />
        Tạo báo giá mới
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Tạo báo giá trực tiếp</h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Khách hàng, catalog và sản phẩm tùy chỉnh</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="flex gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button
                    onClick={() => setMode("existing")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === "existing" ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "text-gray-500 hover:bg-white/50"}`}
                  >
                    <Search size={14} /> Khách cũ
                  </button>
                  <button
                    onClick={() => setMode("new")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === "new" ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" : "text-gray-500 hover:bg-white/50"}`}
                  >
                    <UserPlus size={14} /> Khách mới
                  </button>
                </div>

                {mode === "existing" ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Tìm khách hàng..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400"
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCustomerId(c.id)}
                          disabled={isPending}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${selectedCustomerId === c.id ? "bg-indigo-50 border-indigo-200" : "border-gray-50 hover:bg-indigo-50 hover:border-indigo-100"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-indigo-500">
                              <User size={14} />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-800">{c.name}</div>
                              <div className="text-[10px] text-gray-400">{c.companyName || "Cá nhân"}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Họ tên *" className="w-full px-4 py-2 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-indigo-400" />
                    <input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} placeholder="Công ty" className="w-full px-4 py-2 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-indigo-400" />
                    <div className="grid grid-cols-2 gap-3">
                      <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="SĐT" className="w-full px-4 py-2 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-indigo-400" />
                      <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-indigo-400" />
                    </div>
                    <textarea value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Địa chỉ" rows={2} className="w-full px-4 py-2 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-indigo-400 resize-none" />
                  </div>
                )}
              </div>

              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sản phẩm catalog</h4>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm sản phẩm..."
                      value={productSearch}
                      onChange={(e) => handleProductSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-400"
                    />
                    {foundProducts.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                        {foundProducts.map((p) => (
                          <button key={p.id} onClick={() => addProduct(p)} className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 text-left transition-colors">
                            <div>
                              <div className="text-xs font-bold text-gray-800">{p.name}</div>
                              <div className="text-[10px] text-gray-400">{p.sku}</div>
                            </div>
                            <Plus size={14} className="text-indigo-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-10">
                    {selectedProducts.map((p) => (
                      <span key={p.id} className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-700">
                        {p.name}
                        <button onClick={() => setSelectedProducts((prev) => prev.filter((item) => item.id !== p.id))} className="text-indigo-300 hover:text-red-500"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sản phẩm tùy chỉnh</h4>
                  <input value={customDraft.name} onChange={(e) => setCustomDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Tên sản phẩm/dịch vụ" className="w-full px-3 py-2 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-indigo-400" />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" min={1} value={customDraft.quantity} onChange={(e) => setCustomDraft((p) => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} className="px-3 py-2 rounded-xl border border-gray-100 text-sm" />
                    <input value={customDraft.unit} onChange={(e) => setCustomDraft((p) => ({ ...p, unit: e.target.value }))} className="px-3 py-2 rounded-xl border border-gray-100 text-sm" />
                    <input type="number" min={0} value={customDraft.unitPrice} onChange={(e) => setCustomDraft((p) => ({ ...p, unitPrice: parseFloat(e.target.value) || 0 }))} className="px-3 py-2 rounded-xl border border-gray-100 text-sm" />
                  </div>
                  <button onClick={addCustomItem} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-gray-600 hover:bg-indigo-50 hover:text-indigo-600">
                    <Package size={14} /> Thêm dòng tùy chỉnh
                  </button>
                  <div className="space-y-2">
                    {customItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                        <span className="font-semibold text-gray-700">{item.name} · {item.quantity} {item.unit}</span>
                        <button onClick={() => setCustomItems((prev) => prev.filter((i) => i.id !== item.id))} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={handleCreate}
                disabled={isPending || (mode === "new" && !newName.trim()) || (mode === "existing" && !selectedCustomerId)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-100"
              >
                {isPending ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                Tạo báo giá
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
