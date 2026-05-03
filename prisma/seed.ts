import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding...\n");

  // ── USERS ──
  const adminPw = await bcrypt.hash("admin123", 12);
  const salesPw = await bcrypt.hash("sales123", 12);
  const admin = await prisma.user.upsert({ where: { email: "admin@greenpeat.vn" }, update: {}, create: { email: "admin@greenpeat.vn", name: "Admin GreenPeat", phone: "0275 123 4567", passwordHash: adminPw, role: "ADMIN" } });
  const sales = await prisma.user.upsert({ where: { email: "sales@greenpeat.vn" }, update: {}, create: { email: "sales@greenpeat.vn", name: "Nguyễn Thị Hương", phone: "0909 123 456", passwordHash: salesPw, role: "SALES" } });
  console.log(`✅ Users: ${admin.email}, ${sales.email}`);

  // ── CATEGORIES ──
  const cats = [
    { slug: "growbag", sortOrder: 1, vi: { name: "Growbag", description: "Túi giá thể mụn dừa" }, en: { name: "Growbag", description: "Cocopeat grow bags" } },
    { slug: "cocopeat", sortOrder: 2, vi: { name: "Đất mụn dừa", description: "Mụn dừa xử lý" }, en: { name: "Cocopeat", description: "Processed coir pith" } },
    { slug: "block", sortOrder: 3, vi: { name: "Cocopeat Block", description: "Block mụn dừa ép" }, en: { name: "Cocopeat Block", description: "Compressed coir blocks" } },
    { slug: "loose", sortOrder: 4, vi: { name: "Loose / Bulk", description: "Mụn dừa rời" }, en: { name: "Loose / Bulk", description: "Loose cocopeat" } },
    { slug: "substrate", sortOrder: 5, vi: { name: "Giá thể chuyên dụng", description: "Giá thể hoa, cây giống" }, en: { name: "Specialty Substrate", description: "Substrates for flowers & seedlings" } },
    { slug: "fiber", sortOrder: 6, vi: { name: "Xơ dừa", description: "Sợi xơ dừa" }, en: { name: "Coco Fiber", description: "Coconut fiber" } },
  ];
  const catMap: Record<string, string> = {};
  for (const c of cats) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug }, update: {},
      create: { slug: c.slug, sortOrder: c.sortOrder, translations: { create: [{ locale: "vi", ...c.vi }, { locale: "en", ...c.en }] } },
    });
    catMap[c.slug] = cat.id;
  }
  console.log(`✅ ${cats.length} categories`);

  // ── PRODUCTS ──
  const prods = [
    {
      sku: "AGRICOX-GB-100", slug: "cocopeat-growbag-agricox", catSlug: "growbag", unit: "bag", moq: "2,400 bags (1×40ft)", sortOrder: 1, imageUrl: "/images/products/growbag.png",
      vi: { name: "Cocopeat Growbag AgriCoX", shortDescription: "Growbag mụn dừa cao cấp thương hiệu AgriCoX", fullDescription: "Growbag mụn dừa cao cấp thương hiệu AgriCoX, được xử lý đạt chuẩn xuất khẩu với EC cực thấp. Phù hợp trồng dưa lưới, cà chua, dâu tây trong nhà kính công nghệ cao.", specifications: JSON.stringify({ dimensions: "100 × 20 × 12 cm", weight: "4.5 – 5 kg/bao", ec: "< 0.5 mS/cm", ph: "5.5 – 6.5", moisture: "< 20%", fiberRatio: "Chips 30% / Peat 70%", waterRetention: "Giữ nước 8–10 lần trọng lượng" }), packaging: "Bao PE co nhiệt, đóng pallet 200 bao/pallet", applications: JSON.stringify(["Trồng dưa lưới trong nhà kính", "Trồng cà chua, ớt ngọt", "Trồng dâu tây thủy canh", "Nông nghiệp công nghệ cao"]), referencePrice: "Liên hệ báo giá" },
      en: { name: "AgriCoX Cocopeat Growbag", shortDescription: "Premium cocopeat growbag by AgriCoX", fullDescription: "Premium AgriCoX cocopeat growbag, processed to export standards with ultra-low EC. Ideal for melon, tomato, and strawberry cultivation in high-tech greenhouses.", specifications: JSON.stringify({ dimensions: "100 × 20 × 12 cm", weight: "4.5 – 5 kg/bag", ec: "< 0.5 mS/cm", ph: "5.5 – 6.5", moisture: "< 20%", fiberRatio: "Chips 30% / Peat 70%", waterRetention: "Holds 8–10× its weight in water" }), packaging: "PE shrink-wrap bags, palletized 200 bags/pallet", applications: JSON.stringify(["Melon growing in greenhouses", "Tomato & bell pepper cultivation", "Hydroponic strawberry farming", "High-tech agriculture"]), referencePrice: "Contact for quote" },
    },
    {
      sku: "AGRICOX-CP-5K", slug: "dat-mun-dua-xu-ly", catSlug: "cocopeat", unit: "block", moq: "1 container 20ft", sortOrder: 2, imageUrl: "/images/products/cocopeat.png",
      vi: { name: "Đất mụn dừa xử lý", shortDescription: "Mụn dừa đã qua quy trình xử lý 8 bước", fullDescription: "Mụn dừa đã qua quy trình xử lý 8 bước: thu gom, sàng lọc, rửa sạch, xử lý EC, ủ hoai, ép khuôn, kiểm tra chất lượng, đóng gói. Đạt tiêu chuẩn xuất khẩu châu Âu, Nhật Bản.", specifications: JSON.stringify({ dimensions: "30 × 30 × 12 cm (block 5kg)", weight: "5 kg/block", ec: "< 0.5 mS/cm", ph: "5.8 – 6.5", moisture: "< 18%", fiberRatio: "Peat 85% / Fiber 15%", waterRetention: "Giữ nước 6–8 lần trọng lượng" }), packaging: "Block ép co nhiệt, đóng pallet", applications: JSON.stringify(["Giá thể trộn đất trồng cây", "Trồng rau sạch organic", "Ươm cây giống", "Cải tạo đất nông nghiệp"]) },
      en: { name: "Processed Cocopeat", shortDescription: "8-step processed coir pith", fullDescription: "Coir pith processed through 8 rigorous steps: collection, screening, washing, EC treatment, composting, pressing, quality check, and packaging. Meets EU, Japan, and Korea export standards.", specifications: JSON.stringify({ dimensions: "30 × 30 × 12 cm (5kg block)", weight: "5 kg/block", ec: "< 0.5 mS/cm", ph: "5.8 – 6.5", moisture: "< 18%", fiberRatio: "Peat 85% / Fiber 15%", waterRetention: "Holds 6–8× its weight in water" }), packaging: "Shrink-wrapped blocks, palletized", applications: JSON.stringify(["Soil amendment for potting mix", "Organic vegetable growing", "Seedling nurseries", "Agricultural soil improvement"]) },
    },
    {
      sku: "AGRICOX-BK-5K", slug: "cocopeat-block-5kg", catSlug: "block", unit: "block", moq: "500 blocks", sortOrder: 3, imageUrl: "/images/products/block-5kg.png",
      vi: { name: "Cocopeat Block 5kg", shortDescription: "Block mụn dừa ép 5kg, dễ vận chuyển", fullDescription: "Block mụn dừa ép 5kg, dễ vận chuyển và bảo quản. Chỉ cần thêm nước để nở ra 60–70 lít giá thể tơi xốp.", specifications: JSON.stringify({ dimensions: "30 × 30 × 12 cm", weight: "5 kg/block", ec: "< 0.8 mS/cm", ph: "5.5 – 6.8", moisture: "< 20%", fiberRatio: "Peat 80% / Fiber 20%", waterRetention: "Nở 60–70 lít khi ngâm nước" }), packaging: "Block đơn hoặc đóng 24 block/pallet", applications: JSON.stringify(["Bán lẻ tại cửa hàng nông nghiệp", "Trồng cây tại nhà", "Ươm cây giống quy mô nhỏ"]) },
      en: { name: "Cocopeat Block 5kg", shortDescription: "Compressed 5kg coir block, easy transport", fullDescription: "Compressed 5kg coir block, easy to transport and store. Simply add water to expand into 60–70 liters of fluffy growing substrate.", specifications: JSON.stringify({ dimensions: "30 × 30 × 12 cm", weight: "5 kg/block", ec: "< 0.8 mS/cm", ph: "5.5 – 6.8", moisture: "< 20%", fiberRatio: "Peat 80% / Fiber 20%", waterRetention: "Expands to 60–70L when hydrated" }), packaging: "Single blocks or 24 blocks/pallet", applications: JSON.stringify(["Retail at garden centers", "Home gardening", "Small-scale seedling nurseries"]) },
    },
    {
      sku: "AGRICOX-LB-1T", slug: "cocopeat-loose-bulk", catSlug: "loose", unit: "ton", moq: "20 tons", sortOrder: 4, imageUrl: "/images/products/loose-bulk.png",
      vi: { name: "Mụn dừa rời (Bulk)", shortDescription: "Mụn dừa rời đóng bao jumbo", fullDescription: "Mụn dừa rời (loose) đóng bao jumbo hoặc bao nhỏ, phù hợp cho trang trại lớn. Có thể tùy chỉnh tỷ lệ xơ/mụn theo yêu cầu.", specifications: JSON.stringify({ weight: "Bao jumbo 1000 kg hoặc bao 25 kg", ec: "< 1.0 mS/cm", ph: "5.5 – 6.5", moisture: "< 25%", fiberRatio: "Tùy chỉnh theo yêu cầu", waterRetention: "Giữ nước 5–8 lần trọng lượng" }), packaging: "Jumbo bag 1 tấn hoặc bao PE 25kg", applications: JSON.stringify(["Trang trại quy mô lớn", "Nhà kính công nghiệp", "Dự án cảnh quan đô thị"]) },
      en: { name: "Loose Cocopeat (Bulk)", shortDescription: "Loose cocopeat in jumbo bags", fullDescription: "Loose cocopeat in jumbo or small bags, ideal for large-scale farms. Fiber/peat ratio customizable per client requirements.", specifications: JSON.stringify({ weight: "Jumbo bag 1000 kg or 25 kg bags", ec: "< 1.0 mS/cm", ph: "5.5 – 6.5", moisture: "< 25%", fiberRatio: "Customizable per requirement", waterRetention: "Holds 5–8× its weight in water" }), packaging: "1-ton jumbo bags or 25kg PE bags", applications: JSON.stringify(["Large-scale farms", "Industrial greenhouses", "Urban landscaping projects"]) },
    },
    {
      sku: "AGRICOX-GB-RAU", slug: "gia-the-trong-rau-dua-luoi", catSlug: "growbag", unit: "bag", moq: "1 container 20ft", sortOrder: 5, imageUrl: "/images/products/growbag-rau.png",
      vi: { name: "Giá thể trồng rau & dưa lưới", shortDescription: "Growbag chuyên dụng cho rau và dưa lưới", fullDescription: "Growbag chuyên dụng cho trồng rau ăn lá, dưa lưới, dưa leo trong hệ thống nhà kính. Công thức phối trộn tối ưu.", specifications: JSON.stringify({ dimensions: "100 × 18 × 10 cm", weight: "3.5 – 4 kg/bao", ec: "< 0.5 mS/cm", ph: "5.5 – 6.5", moisture: "< 20%", fiberRatio: "Chips 40% / Peat 60%", waterRetention: "Giữ nước 7–9 lần trọng lượng" }), packaging: "Bao PE, đóng pallet", applications: JSON.stringify(["Trồng dưa lưới Nhật", "Trồng rau ăn lá thủy canh", "Trồng dưa leo baby"]) },
      en: { name: "Vegetable & Melon Growbag", shortDescription: "Specialized growbag for vegetables and melons", fullDescription: "Specialized growbag for leafy vegetables, melons, and cucumbers in greenhouse systems. Optimally blended formula.", specifications: JSON.stringify({ dimensions: "100 × 18 × 10 cm", weight: "3.5 – 4 kg/bag", ec: "< 0.5 mS/cm", ph: "5.5 – 6.5", moisture: "< 20%", fiberRatio: "Chips 40% / Peat 60%", waterRetention: "Holds 7–9× its weight in water" }), packaging: "PE bags, palletized", applications: JSON.stringify(["Japanese melon cultivation", "Hydroponic leafy vegetables", "Baby cucumber growing"]) },
    },
    {
      sku: "AGRICOX-SUB-HOA", slug: "gia-the-trong-hoa-cay-giong", catSlug: "substrate", unit: "bag", moq: "500 bags", sortOrder: 6, imageUrl: "/images/products/substrate-hoa.png",
      vi: { name: "Giá thể trồng hoa & cây giống", shortDescription: "Giá thể mụn dừa mịn cho hoa và cây cảnh", fullDescription: "Giá thể mụn dừa mịn, chuyên dụng cho ươm hạt giống, trồng hoa và cây cảnh. Xử lý kỹ lưỡng, không mầm bệnh.", specifications: JSON.stringify({ weight: "Bao 50 lít hoặc block 5kg", ec: "< 0.5 mS/cm", ph: "6.0 – 6.5", moisture: "< 15%", fiberRatio: "Peat mịn 90% / Fiber 10%", waterRetention: "Giữ nước 8–10 lần trọng lượng" }), packaging: "Bao PE 50L hoặc block ép", applications: JSON.stringify(["Ươm giống rau, hoa", "Trồng hoa trong chậu", "Trồng cây cảnh nội thất"]) },
      en: { name: "Flower & Seedling Substrate", shortDescription: "Fine cocopeat substrate for flowers and ornamentals", fullDescription: "Fine-grade cocopeat substrate for seed germination, flower growing, and ornamental plants. Thoroughly processed, pathogen-free.", specifications: JSON.stringify({ weight: "50L bags or 5kg blocks", ec: "< 0.5 mS/cm", ph: "6.0 – 6.5", moisture: "< 15%", fiberRatio: "Fine peat 90% / Fiber 10%", waterRetention: "Holds 8–10× its weight in water" }), packaging: "50L PE bags or compressed blocks", applications: JSON.stringify(["Vegetable & flower seedling nurseries", "Potted flower growing", "Indoor ornamental plants"]) },
    },
  ];

  for (const p of prods) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.product.create({
        data: {
          sku: p.sku, slug: p.slug, categoryId: catMap[p.catSlug], unit: p.unit, moq: p.moq,
          sortOrder: p.sortOrder, imageUrl: p.imageUrl, showPrice: false,
          translations: { create: [{ locale: "vi", ...p.vi }, { locale: "en", ...p.en }] },
        },
      });
    }
  }
  console.log(`✅ ${prods.length} products (× 2 locales)`);

  // ── PAGES ──
  const pages = [
    { slug: "home", template: "home" },
    { slug: "about", template: "about" },
    { slug: "technology", template: "technology" },
    { slug: "contact", template: "contact" },
  ];
  for (const pg of pages) {
    await prisma.page.upsert({
      where: { slug: pg.slug }, update: {},
      create: { slug: pg.slug, template: pg.template },
    });
  }
  // Page translations will be seeded via a separate content seed or admin CMS
  console.log(`✅ ${pages.length} pages (content via admin)`);

  // ── PROJECTS ──
  const projects = [
    {
      slug: "trang-trai-dua-luoi-da-lat", imageUrl: "/images/project-dalat.jpg", location: "Đà Lạt, Lâm Đồng", cropType: "Melon", scale: "2 ha", sortOrder: 1,
      vi: { title: "Trang trại dưa lưới CNC Đà Lạt", productsUsed: "Cocopeat Growbag AgriCoX", results: "Năng suất tăng 35% so với trồng đất truyền thống, tiết kiệm 40% nước tưới.", feedback: "\"AgriCoX growbag giúp chúng tôi kiểm soát dinh dưỡng tốt hơn.\" – Anh Nguyễn Văn Minh" },
      en: { title: "High-Tech Melon Farm – Da Lat", productsUsed: "AgriCoX Cocopeat Growbag", results: "35% yield increase vs. traditional soil, 40% water savings.", feedback: "\"AgriCoX growbags help us control nutrition much better.\" – Mr. Nguyen Van Minh" },
    },
    {
      slug: "nha-kinh-dau-tay-moc-chau", imageUrl: "/images/project-mocchau.jpg", location: "Mộc Châu, Sơn La", cropType: "Strawberry", scale: "5,000 m²", sortOrder: 2,
      vi: { title: "Dự án nhà kính dâu tây Mộc Châu", productsUsed: "Cocopeat Growbag AgriCoX, Đất mụn dừa xử lý", results: "Thu hoạch quanh năm, giảm 50% bệnh rễ.", feedback: "\"Chuyển sang AgriCoX là quyết định đúng đắn nhất.\" – Chị Trần Thị Hoa" },
      en: { title: "Strawberry Greenhouse – Moc Chau", productsUsed: "AgriCoX Cocopeat Growbag, Processed Cocopeat", results: "Year-round harvest, 50% reduction in root diseases.", feedback: "\"Switching to AgriCoX was our best decision.\" – Ms. Tran Thi Hoa" },
    },
    {
      slug: "xuat-khau-cocopeat-nhat-ban", imageUrl: "/images/project-japan.jpg", location: "Tokyo, Japan", cropType: "Cherry Tomato", scale: "500 tons/year", sortOrder: 3,
      vi: { title: "Xuất khẩu cocopeat – Nhật Bản", productsUsed: "Cocopeat Block 5kg, Loose Bulk", results: "Đạt tiêu chuẩn JAS, cung cấp ổn định 12 tháng, zero claim.", feedback: "\"GreenPeat is our most reliable supplier in Southeast Asia.\" – Mr. Tanaka" },
      en: { title: "Cocopeat Export – Japan", productsUsed: "Cocopeat Block 5kg, Loose Bulk", results: "Met JAS standards, stable 12-month supply, zero quality claims.", feedback: "\"GreenPeat is our most reliable supplier in Southeast Asia.\" – Mr. Tanaka" },
    },
    {
      slug: "trang-trai-rau-sach-long-an", imageUrl: "/images/project-longan.jpg", location: "Long An", cropType: "Leafy Vegetables", scale: "3 ha", sortOrder: 4,
      vi: { title: "Trang trại rau sạch Long An", productsUsed: "Giá thể trồng rau & dưa lưới, Đất mụn dừa xử lý", results: "Sản lượng 15 tấn/tháng, đạt GlobalGAP.", feedback: "\"Giá thể GreenPeat giúp rau phát triển đồng đều, ít sâu bệnh.\" – Ông Lê Hoàng Nam" },
      en: { title: "Clean Vegetable Farm – Long An", productsUsed: "Vegetable & Melon Growbag, Processed Cocopeat", results: "15 tons/month output, GlobalGAP certified.", feedback: "\"GreenPeat substrate ensures uniform growth with fewer pests.\" – Mr. Le Hoang Nam" },
    },
  ];
  for (const pj of projects) {
    const existing = await prisma.project.findUnique({ where: { slug: pj.slug } });
    if (!existing) {
      await prisma.project.create({
        data: {
          slug: pj.slug, imageUrl: pj.imageUrl, location: pj.location, cropType: pj.cropType, scale: pj.scale, sortOrder: pj.sortOrder,
          translations: { create: [{ locale: "vi", ...pj.vi }, { locale: "en", ...pj.en }] },
        },
      });
    }
  }
  console.log(`✅ ${projects.length} projects (× 2 locales)`);

  // ── SAMPLE CUSTOMERS ──
  if ((await prisma.customer.count()) === 0) {
    await prisma.customer.createMany({
      data: [
        { name: "Nguyễn Văn Minh", companyName: "Nông trại Phú Gia Đà Lạt", email: "minh@phugiafarming.com", phone: "0918 234 567", province: "Đà Lạt", preferredLocale: "vi", customerType: "DOMESTIC", source: "DIRECT" },
        { name: "Mr. Tanaka", companyName: "Tokyo Agri Corp", email: "tanaka@tokyoagri.jp", phone: "+81 90 1234 5678", country: "Japan", preferredLocale: "en", customerType: "EXPORT", source: "EXHIBITION" },
        { name: "Trần Thị Mai", companyName: "Trang trại Hoa Sen", email: "mai@hoasen-farm.vn", phone: "0903 567 890", province: "Tp. HCM", preferredLocale: "vi", customerType: "DOMESTIC", source: "WEBSITE" },
      ],
    });
    console.log("✅ 3 sample customers");
  }

  console.log("\n🎉 Seed completed!");
  console.log("📧 Admin: admin@greenpeat.vn / admin123");
  console.log("📧 Sales: sales@greenpeat.vn / sales123");
}

main()
  .catch((e) => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
