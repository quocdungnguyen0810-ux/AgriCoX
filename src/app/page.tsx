import { cookies } from "next/headers";
import { getFeaturedProducts } from "@/lib/queries";
import HomeClient from "./HomeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GreenPeat AgriCoX – Giải pháp giá thể mụn dừa & nông nghiệp bền vững",
  description:
    "GreenPeat cung cấp cocopeat growbag, đất mụn dừa xử lý đạt chuẩn xuất khẩu. Phù hợp nhà kính, thủy canh, nông nghiệp CNC.",
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "vi";

  const products = await getFeaturedProducts(locale, 4);

  const serialized = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: String(p.name),
    description: String(p.description),
    categoryName: String(p.categoryName),
    packaging: String(p.packaging),
    imageUrl: p.imageUrl,
    specifications: p.specifications as Record<string, string>,
  }));

  return <HomeClient featuredProducts={serialized} />;
}
