import prisma from "@/lib/prisma";

// ── Helper: flatten translation into entity ──
function flattenTranslation<T extends Record<string, unknown>>(
  entity: T & { translations: Record<string, unknown>[] },
): Omit<T, "translations"> & Record<string, unknown> {
  const { translations, ...rest } = entity;
  const t = translations[0] || {};
  return { ...rest, ...t };
}

// ── PRODUCTS ──
export async function getProducts(locale: string, categorySlug?: string) {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    include: {
      translations: { where: { locale } },
      category: { include: { translations: { where: { locale } } } },
    },
    orderBy: { sortOrder: "asc" },
  });
  return products.map((p) => {
    const { translations, category, ...rest } = p;
    const t = translations[0] || {} as Record<string, unknown>;
    const catT = category?.translations?.[0];
    return {
      ...rest,
      name: t.name || "",
      shortDescription: t.shortDescription || "",
      description: t.fullDescription || t.shortDescription || "",
      specifications: t.specifications ? (typeof t.specifications === "string" ? JSON.parse(t.specifications) : t.specifications) : {},
      packaging: t.packaging || "",
      applications: t.applications ? (typeof t.applications === "string" ? JSON.parse(t.applications) : t.applications) : [],
      referencePrice: t.referencePrice || undefined,
      seoTitle: t.seoTitle || undefined,
      seoDescription: t.seoDescription || undefined,
      categoryName: catT?.name || category?.slug || "",
      categorySlug: category?.slug || "",
    };
  });
}

export async function getProductBySlug(slug: string, locale: string) {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: {
      translations: { where: { locale } },
      category: { include: { translations: { where: { locale } } } },
    },
  });
  if (!p) return null;
  const t = p.translations[0] || {} as Record<string, unknown>;
  const catT = p.category?.translations?.[0];
  return {
    ...p,
    translations: undefined,
    name: t.name || "",
    shortDescription: t.shortDescription || "",
    description: t.fullDescription || t.shortDescription || "",
    specifications: t.specifications ? (typeof t.specifications === "string" ? JSON.parse(t.specifications) : t.specifications) : {},
    packaging: t.packaging || "",
    applications: t.applications ? (typeof t.applications === "string" ? JSON.parse(t.applications) : t.applications) : [],
    referencePrice: t.referencePrice || undefined,
    categoryName: catT?.name || p.category?.slug || "",
    categorySlug: p.category?.slug || "",
  };
}

export async function getFeaturedProducts(locale: string, limit = 4) {
  const products = await getProducts(locale);
  return products.slice(0, limit);
}

// ── CATEGORIES ──
export async function getCategories(locale: string) {
  const cats = await prisma.category.findMany({
    where: { status: "ACTIVE" },
    include: { translations: { where: { locale } } },
    orderBy: { sortOrder: "asc" },
  });
  return cats.map((c) => {
    const t = c.translations[0];
    return { id: c.slug, slug: c.slug, name: t?.name || c.slug, description: t?.description || "" };
  });
}

// ── PAGES ──
export async function getPageContent(slug: string, locale: string) {
  const page = await prisma.page.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });
  if (!page) return null;
  const t = page.translations[0];
  let contentJson = {};
  if (t?.contentJson) {
    try { contentJson = typeof t.contentJson === "string" ? JSON.parse(t.contentJson) : t.contentJson; } catch { /* */ }
  }
  return { slug: page.slug, template: page.template, title: t?.title || "", subtitle: t?.subtitle || "", content: contentJson, seoTitle: t?.seoTitle, seoDescription: t?.seoDescription };
}

// ── PROJECTS ──
export async function getProjects(locale: string) {
  const projects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    include: { translations: { where: { locale } } },
    orderBy: { sortOrder: "asc" },
  });
  return projects.map((p) => {
    const t = p.translations[0];
    return {
      id: p.id, slug: p.slug, imageUrl: p.imageUrl, location: p.location, cropType: p.cropType, scale: p.scale,
      name: t?.title || "", title: t?.title || "", productsUsed: t?.productsUsed || "", results: t?.results || "", feedback: t?.feedback || "",
    };
  });
}
