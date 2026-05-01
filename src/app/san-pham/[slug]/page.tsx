import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/queries";
import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "vi";

  const product = await getProductBySlug(slug, locale);
  if (!product) return notFound();

  const allProducts = await getProducts(locale);
  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id)
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: String(p.name),
      description: String(p.description),
    }));

  const serialized = {
    id: product.id,
    slug: product.slug,
    name: String(product.name),
    description: String(product.description),
    categoryName: String(product.categoryName),
    categorySlug: String(product.categorySlug),
    packaging: String(product.packaging),
    moq: product.moq,
    imageUrl: product.imageUrl,
    specifications: product.specifications as Record<string, string>,
    applications: product.applications as string[],
  };

  return <ProductDetailClient product={serialized} relatedProducts={relatedProducts} />;
}
