"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Leaf,
  Search,
  ShoppingCart,
  Eye,
  Filter,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

interface ProductItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  packaging: string;
  moq: string | null;
  imageUrl: string | null;
  specifications: Record<string, string>;
}

interface CategoryItem {
  id: string;
  name: string;
}

interface ProductsClientProps {
  products: ProductItem[];
  categories: CategoryItem[];
}

export default function ProductsClient({ products, categories }: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { addItem } = useCart();
  const { locale } = useLanguage();

  const allCategories: CategoryItem[] = [
    { id: "all", name: locale === "en" ? "All" : "Tất cả" },
    ...categories,
  ];

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === "all" || p.categorySlug === activeCategory;
    const matchSearch =
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      {/* Hero */}
      <section className="gradient-hero text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-10 right-20 w-64 h-64 bg-brown-400/10 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-200 text-sm mb-6">
            <Leaf size={16} /> {locale === "en" ? "AgriCoX Products" : "Sản phẩm AgriCoX"}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            {locale === "en" ? "Product " : "Danh mục "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-brown-300">
              {locale === "en" ? "Catalog" : "sản phẩm"}
            </span>
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            {locale === "en"
              ? "High-quality cocopeat substrates for all agricultural needs — from small-scale to industrial export."
              : "Giá thể mụn dừa chất lượng cao – phù hợp mọi nhu cầu nông nghiệp từ quy mô nhỏ đến xuất khẩu công nghiệp."}
          </p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="section">
        <div className="container-custom">
          {/* Search & Filter bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={locale === "en" ? "Search products..." : "Tìm kiếm sản phẩm..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input !pl-11"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter size={18} className="text-gray-400 shrink-0" />
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                      : "bg-white text-gray-600 hover:bg-green-50 border border-gray-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <Search size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {locale === "en" ? "No matching products found." : "Không tìm thấy sản phẩm phù hợp."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <div key={product.id} className="card group">
                  {/* Image */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-green-50 to-brown-50 flex items-center justify-center relative overflow-hidden">
                    <div className="text-center">
                      <Leaf
                        size={56}
                        className="text-green-300 mx-auto mb-2 group-hover:scale-110 transition-transform duration-500"
                      />
                      <span className="text-sm text-gray-400 font-medium">
                        {product.categoryName}
                      </span>
                    </div>
                    <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-green-600 text-white text-xs font-semibold">
                      {product.categoryName}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed">
                      {product.description}
                    </p>

                    {/* Key specs */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {product.specifications.ec && (
                        <div className="text-center p-2 rounded-lg bg-green-50">
                          <div className="text-xs text-gray-400">EC</div>
                          <div className="text-sm font-bold text-green-700">
                            {product.specifications.ec}
                          </div>
                        </div>
                      )}
                      {product.specifications.ph && (
                        <div className="text-center p-2 rounded-lg bg-brown-50">
                          <div className="text-xs text-gray-400">pH</div>
                          <div className="text-sm font-bold text-brown-600">
                            {product.specifications.ph}
                          </div>
                        </div>
                      )}
                      {product.specifications.moisture && (
                        <div className="text-center p-2 rounded-lg bg-blue-50">
                          <div className="text-xs text-gray-400">
                            {locale === "en" ? "Moisture" : "Ẩm"}
                          </div>
                          <div className="text-sm font-bold text-blue-600">
                            {product.specifications.moisture}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MOQ */}
                    {product.moq && (
                      <div className="text-xs text-gray-400 mb-4">
                        MOQ: <span className="font-semibold text-gray-600">{product.moq}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link
                        href={`/san-pham/${product.slug}`}
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-lg bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors"
                      >
                        <Eye size={16} /> {locale === "en" ? "Details" : "Chi tiết"}
                      </Link>
                      <button
                        onClick={() =>
                          addItem({
                            productId: product.id,
                            productName: product.name,
                            quantity: 1,
                            specification: product.packaging,
                            image: product.imageUrl || "",
                          })
                        }
                        className="flex-1 flex items-center justify-center gap-1.5 text-sm py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                      >
                        <ShoppingCart size={16} /> {locale === "en" ? "Add RFQ" : "Thêm RFQ"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
