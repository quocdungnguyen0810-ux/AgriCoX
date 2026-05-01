import { cookies } from "next/headers";
import { getProducts } from "@/lib/queries";
import OrderClient from "./OrderClient";

export default async function OrderPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "vi";

  const products = await getProducts(locale);
  const productList = products.map((p) => ({
    id: p.id,
    name: String(p.name),
  }));

  return <OrderClient productList={productList} />;
}
