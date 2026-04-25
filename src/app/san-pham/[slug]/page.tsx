"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import {
  Leaf,
  ArrowLeft,
  ShoppingCart,
  FileText,
  CheckCircle2,
  Package,
  Ruler,
  Droplets,
  Weight,
  ChevronRight,
} from "lucide-react";
import { products } from "@/data/products";
import { useCart } from "@/context/CartContext";

const specLabels: Record<string, { label: string; icon: React.ElementType }> = {
  dimensions: { label: "Kích thước", icon: Ruler },
  weight: { label: "Khối lượng", icon: Weight },
  ec: { label: "EC (Điện dẫn)", icon: Droplets },
  ph: { label: "pH", icon: Droplets },
  moisture: { label: "Độ ẩm", icon: Droplets },
  fiberRatio: { label: "Tỷ lệ xơ/mụn", icon: Package },
  waterRetention: { label: "Khả năng giữ nước", icon: Droplets },
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const product = products.find((p) => p.slug === slug);
  const { addItem } = useCart();

  if (!product) return notFound();

  const relatedProducts = products
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-gray-soft border-b border-gray-200">
        <div className="container-custom py-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-green-600 transition-colors">
            Trang chủ
          </Link>
          <ChevronRight size={14} />
          <Link
            href="/san-pham"
            className="hover:text-green-600 transition-colors"
          >
            Sản phẩm
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">{product.name}</span>
        </div>
      </div>

      {/* Product detail */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image */}
            <div>
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-green-50 to-brown-50 flex items-center justify-center border border-gray-100 sticky top-24">
                <div className="text-center p-8">
                  <Leaf
                    size={80}
                    className="text-green-300 mx-auto mb-4"
                  />
                  <span className="text-gray-400 font-medium">
                    {product.category}
                  </span>
                  <div className="mt-4 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-semibold inline-block">
                    AgriCoX Premium
                  </div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-semibold mb-4">
                {product.category}
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-4">
                {product.name}
              </h1>

              <p className="text-gray-600 leading-relaxed text-lg mb-8">
                {product.description}
              </p>

              {/* Key specs highlight */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {product.specifications.ec && (
                  <div className="text-center p-4 rounded-xl bg-green-50 border border-green-100">
                    <div className="text-xs text-gray-400 mb-1">EC</div>
                    <div className="text-xl font-extrabold text-green-700">
                      {product.specifications.ec}
                    </div>
                  </div>
                )}
                {product.specifications.ph && (
                  <div className="text-center p-4 rounded-xl bg-brown-50 border border-brown-100">
                    <div className="text-xs text-gray-400 mb-1">pH</div>
                    <div className="text-xl font-extrabold text-brown-600">
                      {product.specifications.ph}
                    </div>
                  </div>
                )}
                {product.specifications.moisture && (
                  <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="text-xs text-gray-400 mb-1">Độ ẩm</div>
                    <div className="text-xl font-extrabold text-blue-600">
                      {product.specifications.moisture}
                    </div>
                  </div>
                )}
              </div>

              {/* Full specifications */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Thông số kỹ thuật
                </h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(
                    ([key, value]) => {
                      if (!value) return null;
                      const spec = specLabels[key];
                      const Icon = spec?.icon || Package;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                        >
                          <Icon size={18} className="text-green-500 shrink-0" />
                          <span className="text-sm text-gray-500 w-36 shrink-0">
                            {spec?.label || key}
                          </span>
                          <span className="text-sm font-semibold text-gray-800">
                            {value}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Packaging & MOQ */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-xs text-gray-400 mb-1">Quy cách đóng gói</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {product.packaging}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="text-xs text-gray-400 mb-1">MOQ (Đặt tối thiểu)</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {product.moq}
                  </div>
                </div>
              </div>

              {/* Applications */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Ứng dụng
                </h3>
                <div className="space-y-2">
                  {product.applications.map((app, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={18}
                        className="text-green-500 shrink-0"
                      />
                      <span className="text-gray-700">{app}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() =>
                    addItem({
                      productId: product.id,
                      productName: product.name,
                      quantity: 1,
                      specification: product.packaging,
                      image: product.image,
                    })
                  }
                  className="btn-primary flex-1"
                >
                  <ShoppingCart size={18} /> Thêm vào giỏ báo giá
                </button>
                <Link href="/dat-hang" className="btn-accent flex-1 text-center">
                  <FileText size={18} /> Yêu cầu báo giá
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      <section className="section bg-gray-soft">
        <div className="container-custom">
          <h2 className="section-title text-center">
            Sản phẩm <span className="gradient-text">liên quan</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {relatedProducts.map((rp) => (
              <Link key={rp.id} href={`/san-pham/${rp.slug}`} className="card group">
                <div className="aspect-[4/3] bg-gradient-to-br from-green-50 to-brown-50 flex items-center justify-center">
                  <Leaf
                    size={40}
                    className="text-green-300 group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                    {rp.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                    {rp.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/san-pham" className="btn-secondary">
              <ArrowLeft size={18} /> Quay lại danh mục
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
