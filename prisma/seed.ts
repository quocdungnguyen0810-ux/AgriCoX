import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Create Admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@greenpeat.vn" },
    update: {},
    create: {
      email: "admin@greenpeat.vn",
      name: "Admin GreenPeat",
      phone: "0275 123 4567",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // 2. Create Sales user
  const salesPassword = await bcrypt.hash("sales123", 12);
  const sales = await prisma.user.upsert({
    where: { email: "sales@greenpeat.vn" },
    update: {},
    create: {
      email: "sales@greenpeat.vn",
      name: "Nguyễn Thị Hương",
      phone: "0909 123 456",
      passwordHash: salesPassword,
      role: "SALES",
    },
  });
  console.log(`✅ Sales user: ${sales.email}`);

  // 3. Create Products
  const productsData = [
    {
      name: "Cocopeat Growbag AgriCoX",
      slug: "cocopeat-growbag-agricox",
      category: "Growbag",
      description: "Growbag mụn dừa cao cấp thương hiệu AgriCoX, được xử lý đạt chuẩn xuất khẩu với EC cực thấp.",
      applications: JSON.stringify(["Trồng dưa lưới nhà kính", "Trồng cà chua, ớt chuông", "Dâu tây công nghệ cao", "Thủy canh rau sạch"]),
      specifications: JSON.stringify({ dimensions: "100 × 20 × 12 cm", weight: "4.5 – 5 kg", ec: "< 0.5 mS/cm", ph: "5.5 – 6.5", moisture: "< 20%", fiberRatio: "50:50", waterRetention: "8 – 9 lần" }),
      packaging: "Bao PE 4.5kg, pallet 2,400 bao/cont 40ft",
      moq: "1 container 40ft (2,400 bao)",
      imageUrl: "/images/growbag.png",
      sortOrder: 1,
    },
    {
      name: "Đất mụn dừa xử lý",
      slug: "dat-mun-dua-xu-ly",
      category: "Cocopeat",
      description: "Mụn dừa đã qua quy trình xử lý 8 bước.",
      applications: JSON.stringify(["Trộn giá thể trồng rau", "Ươm cây giống", "Cải tạo đất nông nghiệp"]),
      specifications: JSON.stringify({ ec: "< 0.5 mS/cm", ph: "5.8 – 6.5", moisture: "< 18%" }),
      packaging: "Bao 25kg hoặc ép block 5kg",
      moq: "5 tấn",
      imageUrl: "/images/cocopeat-block.png",
      sortOrder: 2,
    },
    {
      name: "Cocopeat Block 5kg",
      slug: "cocopeat-block-5kg",
      category: "Block",
      description: "Block mụn dừa ép 5kg, dễ vận chuyển và bảo quản.",
      applications: JSON.stringify(["Vườn gia đình", "Trồng rau ban công", "Ươm giống"]),
      specifications: JSON.stringify({ dimensions: "30 × 30 × 12 cm", weight: "5 kg", ec: "< 0.8 mS/cm", ph: "5.5 – 6.8" }),
      packaging: "Block shrink-wrap, 400 block/pallet",
      moq: "200 block",
      imageUrl: "/images/cocopeat-block.png",
      sortOrder: 3,
    },
    {
      name: "Giá thể trồng rau & dưa lưới",
      slug: "gia-the-trong-rau-dua-luoi",
      category: "Growbag",
      description: "Growbag chuyên dụng cho trồng rau và dưa lưới.",
      applications: JSON.stringify(["Dưa lưới Nhật Bản", "Dưa leo baby", "Rau ăn lá"]),
      specifications: JSON.stringify({ dimensions: "100 × 18 × 10 cm", weight: "3.5 – 4 kg", ec: "< 0.5 mS/cm", ph: "5.5 – 6.5" }),
      packaging: "Bao PE 3.5kg",
      moq: "1,000 bao",
      imageUrl: "/images/growbag.png",
      sortOrder: 4,
    },
    {
      name: "Mụn dừa thô rời (Bulk)",
      slug: "mun-dua-tho-roi-bulk",
      category: "Bulk",
      description: "Mụn dừa thô chưa ép, dạng rời.",
      applications: JSON.stringify(["Nguyên liệu sản xuất giá thể", "Cải tạo đất quy mô lớn"]),
      specifications: JSON.stringify({ ec: "< 1.0 mS/cm", ph: "5.5 – 7.0", moisture: "< 25%" }),
      packaging: "Bao jumbo 1 tấn hoặc xe tải rời",
      moq: "10 tấn",
      imageUrl: "/images/loose-bulk.png",
      sortOrder: 5,
    },
    {
      name: "Xơ dừa (Coco Fiber)",
      slug: "xo-dua-coco-fiber",
      category: "Fiber",
      description: "Xơ dừa dài, sạch.",
      applications: JSON.stringify(["Trộn giá thể cải thiện thoát nước", "Lưới chống xói mòn"]),
      specifications: JSON.stringify({ fiberRatio: "100% xơ dài > 10cm", moisture: "< 15%", ec: "< 0.8 mS/cm" }),
      packaging: "Bao ép 20kg",
      moq: "5 tấn",
      imageUrl: "/images/coco-fiber.png",
      sortOrder: 6,
    },
  ];

  for (const p of productsData) {
    await prisma.productRecord.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${productsData.length} products seeded`);

  // 4. Create sample customers
  const customerCount = await prisma.customer.count();
  if (customerCount === 0) {
    const customers = [
      {
        companyName: "Nông trại Phú Gia Đà Lạt",
        contactName: "Nguyễn Văn Minh",
        email: "minh@phugiafarming.com",
        phone: "0918 234 567",
        city: "Đà Lạt",
        type: "DOMESTIC",
      },
      {
        companyName: "Tokyo Agri Corp",
        contactName: "Mr. Tanaka",
        email: "tanaka@tokyoagri.jp",
        phone: "+81 90 1234 5678",
        city: "Tokyo",
        country: "Nhật Bản",
        type: "EXPORT",
      },
      {
        companyName: "Trang trại Hoa Sen",
        contactName: "Trần Thị Mai",
        email: "mai@hoasen-farm.vn",
        phone: "0903 567 890",
        city: "Tp. HCM",
        type: "DOMESTIC",
      },
    ];
    for (const c of customers) {
      await prisma.customer.create({ data: c });
    }
    console.log(`✅ ${customers.length} customers seeded`);
  }

  // 5. Create sample quote request
  const rfqCount = await prisma.quoteRequest.count();
  if (rfqCount === 0) {
    await prisma.quoteRequest.create({
      data: {
        rfqCode: "RFQ-2026-001",
        status: "NEW",
        contactName: "Lê Hoàng Nam",
        companyName: "Vườn Nam Phát",
        contactPhone: "0912 345 678",
        contactEmail: "nam@nampharm.com",
        items: JSON.stringify([
          { productName: "Cocopeat Growbag AgriCoX", quantity: 2400, specification: "100×20×12 cm" },
        ]),
        message: "Cần giao hàng trong tháng 5/2026.",
      },
    });
    console.log("✅ 1 sample quote request seeded");
  }

  console.log("\n🎉 Seed completed!");
  console.log("📧 Admin: admin@greenpeat.vn / admin123");
  console.log("📧 Sales: sales@greenpeat.vn / sales123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
