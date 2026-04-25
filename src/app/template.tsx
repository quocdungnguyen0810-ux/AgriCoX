"use client";

import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import CartDrawer from "@/components/public/CartDrawer";
import { CartProvider } from "@/context/CartContext";
import { usePathname } from "next/navigation";

export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
