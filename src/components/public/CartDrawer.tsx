"use client";

import { X, Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function CartDrawer() {
  const { items, removeItem, updateQuantity, clearCart, isOpen, setIsOpen, itemCount } = useCart();

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in-up"
        style={{ animationDuration: "0.2s" }}
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-fade-in-right" style={{ animationDuration: "0.3s" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-green-600" />
            <h2 className="text-lg font-bold text-gray-800">
              Giỏ hàng báo giá
            </h2>
            {itemCount > 0 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShoppingCart size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Chưa có sản phẩm nào</p>
              <p className="text-sm mt-1">Hãy chọn sản phẩm từ danh mục</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100"
                >
                  {/* Product thumbnail placeholder */}
                  <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <ShoppingCart size={20} className="text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-800 truncate">
                      {item.productName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.specification}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-bold w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors self-start"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tổng sản phẩm:</span>
              <span className="font-bold text-gray-800">{items.length} loại</span>
            </div>
            <Link
              href="/gio-hang"
              onClick={() => setIsOpen(false)}
              className="btn-primary w-full text-center"
            >
              Gửi yêu cầu báo giá
            </Link>
            <button
              onClick={clearCart}
              className="w-full text-sm text-gray-500 hover:text-red-500 py-2 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>
    </>
  );
}
