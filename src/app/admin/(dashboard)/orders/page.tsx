import { ShoppingCart } from "lucide-react";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold text-gray-800">
        Quản lý đơn hàng
      </h2>

      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-bold text-gray-600 mb-2">
          Sắp ra mắt
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Module quản lý đơn hàng 15 bước (từ tiếp nhận yêu cầu đến hậu mãi) 
          sẽ được triển khai trong giai đoạn tiếp theo.
        </p>
      </div>
    </div>
  );
}
