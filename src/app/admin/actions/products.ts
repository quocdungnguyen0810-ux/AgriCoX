"use server";

import prisma from "@/lib/prisma";

/**
 * Search products by name (via translations) or SKU.
 * Returns products with their first matching translation name for display.
 */
export async function searchProducts(query: string, locale: string = "vi") {
  try {
    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { sku: { contains: query, mode: "insensitive" } },
          {
            translations: {
              some: {
                name: { contains: query, mode: "insensitive" },
              },
            },
          },
        ],
      },
      include: {
        translations: {
          where: { locale },
          take: 1,
        },
      },
      take: 10,
    });

    // Map to a simplified format for the UI
    const mapped = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.translations[0]?.name || p.sku,
      unit: p.unit,
      imageUrl: p.imageUrl,
      packaging: p.translations[0]?.packaging || null,
      shortDescription: p.translations[0]?.shortDescription || null,
    }));

    return { success: true as const, data: mapped };
  } catch (err) {
    console.error("[searchProducts]", err);
    return { success: false as const, error: "Lỗi tìm kiếm sản phẩm" };
  }
}

/**
 * Get all active products for selection dropdowns.
 */
export async function getAllProducts(locale: string = "vi") {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: {
        translations: {
          where: { locale },
          take: 1,
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const mapped = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.translations[0]?.name || p.sku,
      unit: p.unit,
      imageUrl: p.imageUrl,
      packaging: p.translations[0]?.packaging || null,
    }));

    return { success: true as const, data: mapped };
  } catch (err) {
    console.error("[getAllProducts]", err);
    return { success: false as const, error: "Lỗi tải danh sách sản phẩm" };
  }
}
