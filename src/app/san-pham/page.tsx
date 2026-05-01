import { cookies } from "next/headers";
import { getProducts, getCategories } from "@/lib/queries";
import ProductsClient from "./ProductsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sản phẩm AgriCoX | GreenPeat – Cocopeat Growbag & Substrates",
  description:
    "Danh mục sản phẩm giá thể mụn dừa AgriCoX. Growbag, cocopeat block, mụn dừa rời, xơ dừa chất lượng cao cho nông nghiệp.",
};

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "vi";

  const [products, categories] = await Promise.all([
    getProducts(locale),
    getCategories(locale),
  ]);

  // Serialize for client component
  const serializedProducts = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: String(p.name),
    description: String(p.description),
    categorySlug: String(p.categorySlug),
    categoryName: String(p.categoryName),
    packaging: String(p.packaging),
    moq: p.moq,
    imageUrl: p.imageUrl,
    specifications: p.specifications as Record<string, string>,
  }));

  return <ProductsClient products={serializedProducts} categories={categories} />;
}
