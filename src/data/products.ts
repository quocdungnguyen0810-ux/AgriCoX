export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  applications: string[];
  specifications: {
    dimensions?: string;
    weight?: string;
    ec?: string;
    ph?: string;
    moisture?: string;
    fiberRatio?: string;
    waterRetention?: string;
    [key: string]: string | undefined;
  };
  packaging: string;
  moq: string;
  referencePrice?: string;
  image: string;
  gallery?: string[];
  featured?: boolean;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Cocopeat Growbag AgriCoX",
    slug: "cocopeat-growbag-agricox",
    category: "Growbag",
    description:
      "Growbag mụn dừa cao cấp thương hiệu AgriCoX, được xử lý đạt chuẩn xuất khẩu với EC cực thấp. Phù hợp trồng dưa lưới, cà chua, dâu tây trong nhà kính công nghệ cao. Thiết kế tối ưu hệ rễ, thoát nước tốt, giữ ẩm lâu dài.",
    applications: [
      "Trồng dưa lưới trong nhà kính",
      "Trồng cà chua, ớt ngọt",
      "Trồng dâu tây thủy canh",
      "Trồng hoa cắt cành",
      "Nông nghiệp công nghệ cao",
    ],
    specifications: {
      dimensions: "100 x 20 x 12 cm",
      weight: "4.5 – 5 kg/bao",
      ec: "< 0.5 mS/cm",
      ph: "5.5 – 6.5",
      moisture: "< 20%",
      fiberRatio: "Chips 30% / Peat 70%",
      waterRetention: "Giữ nước 8–10 lần trọng lượng",
    },
    packaging: "Bao PE co nhiệt, đóng pallet 200 bao/pallet",
    moq: "1 container 20ft (≈ 2,400 bao)",
    referencePrice: "Liên hệ báo giá",
    image: "/images/growbag.jpg",
    featured: true,
  },
  {
    id: "2",
    name: "Đất mụn dừa xử lý",
    slug: "dat-mun-dua-xu-ly",
    category: "Cocopeat",
    description:
      "Mụn dừa đã qua quy trình xử lý 8 bước: thu gom, sàng lọc, rửa sạch, xử lý EC, ủ hoai, ép khuôn, kiểm tra chất lượng, đóng gói. Sản phẩm đạt tiêu chuẩn xuất khẩu châu Âu, Nhật Bản, Hàn Quốc.",
    applications: [
      "Giá thể trộn đất trồng cây",
      "Trồng rau sạch organic",
      "Ươm cây giống",
      "Cải tạo đất nông nghiệp",
      "Phủ gốc cây cảnh quan",
    ],
    specifications: {
      dimensions: "30 x 30 x 12 cm (block 5kg)",
      weight: "5 kg/block",
      ec: "< 0.5 mS/cm",
      ph: "5.8 – 6.5",
      moisture: "< 18%",
      fiberRatio: "Peat 85% / Fiber 15%",
      waterRetention: "Giữ nước 6–8 lần trọng lượng",
    },
    packaging: "Block ép co nhiệt, đóng pallet",
    moq: "1 container 20ft",
    image: "/images/cocopeat-block.jpg",
    featured: true,
  },
  {
    id: "3",
    name: "Cocopeat Block 5kg",
    slug: "cocopeat-block-5kg",
    category: "Block",
    description:
      "Block mụn dừa ép 5kg, dễ vận chuyển và bảo quản. Chỉ cần thêm nước để nở ra 60–70 lít giá thể tơi xốp. Lý tưởng cho phân phối lẻ, cửa hàng vật tư nông nghiệp và người trồng cây tại nhà.",
    applications: [
      "Bán lẻ tại cửa hàng nông nghiệp",
      "Trồng cây tại nhà",
      "Ươm cây giống quy mô nhỏ",
      "Trộn giá thể tùy chỉnh",
    ],
    specifications: {
      dimensions: "30 x 30 x 12 cm",
      weight: "5 kg/block",
      ec: "< 0.8 mS/cm",
      ph: "5.5 – 6.8",
      moisture: "< 20%",
      fiberRatio: "Peat 80% / Fiber 20%",
      waterRetention: "Nở 60–70 lít khi ngâm nước",
    },
    packaging: "Block đơn hoặc đóng 24 block/pallet",
    moq: "500 blocks",
    image: "/images/block-5kg.jpg",
    featured: true,
  },
  {
    id: "4",
    name: "Cocopeat Loose / Bulk",
    slug: "cocopeat-loose-bulk",
    category: "Loose",
    description:
      "Mụn dừa rời (loose) đóng bao jumbo hoặc bao nhỏ, phù hợp cho trang trại lớn cần khối lượng giá thể lớn. Có thể tùy chỉnh tỷ lệ xơ/mụn theo yêu cầu khách hàng.",
    applications: [
      "Trang trại quy mô lớn",
      "Nhà kính công nghiệp",
      "Dự án cảnh quan đô thị",
      "Sản xuất phân bón hữu cơ",
    ],
    specifications: {
      weight: "Bao jumbo 1000 kg hoặc bao 25 kg",
      ec: "< 1.0 mS/cm (hoặc theo yêu cầu)",
      ph: "5.5 – 6.5",
      moisture: "< 25%",
      fiberRatio: "Tùy chỉnh theo yêu cầu",
      waterRetention: "Giữ nước 5–8 lần trọng lượng",
    },
    packaging: "Jumbo bag 1 tấn hoặc bao PE 25kg",
    moq: "20 tấn",
    image: "/images/loose-bulk.jpg",
  },
  {
    id: "5",
    name: "Giá thể trồng rau & dưa lưới",
    slug: "gia-the-trong-rau-dua-luoi",
    category: "Growbag",
    description:
      "Growbag chuyên dụng cho trồng rau ăn lá, dưa lưới, dưa leo trong hệ thống nhà kính. Công thức phối trộn tối ưu giữa mụn dừa và xơ dừa chips, đảm bảo độ thoáng khí và giữ ẩm cân bằng.",
    applications: [
      "Trồng dưa lưới Nhật",
      "Trồng rau ăn lá thủy canh",
      "Trồng dưa leo baby",
      "Trồng ớt chuông",
    ],
    specifications: {
      dimensions: "100 x 18 x 10 cm",
      weight: "3.5 – 4 kg/bao",
      ec: "< 0.5 mS/cm",
      ph: "5.5 – 6.5",
      moisture: "< 20%",
      fiberRatio: "Chips 40% / Peat 60%",
      waterRetention: "Giữ nước 7–9 lần trọng lượng",
    },
    packaging: "Bao PE, đóng pallet",
    moq: "1 container 20ft",
    image: "/images/growbag-rau.jpg",
    featured: true,
  },
  {
    id: "6",
    name: "Giá thể trồng hoa & cây giống",
    slug: "gia-the-trong-hoa-cay-giong",
    category: "Substrate",
    description:
      "Giá thể mụn dừa mịn, chuyên dụng cho ươm hạt giống, trồng hoa và cây cảnh. Được xử lý kỹ lưỡng để đảm bảo không chứa mầm bệnh, cỏ dại. Kết cấu tơi xốp, giữ ẩm tốt, thoáng khí.",
    applications: [
      "Ươm giống rau, hoa",
      "Trồng hoa trong chậu",
      "Trồng cây cảnh nội thất",
      "Vườn ươm công nghiệp",
    ],
    specifications: {
      weight: "Bao 50 lít hoặc block 5kg",
      ec: "< 0.5 mS/cm",
      ph: "6.0 – 6.5",
      moisture: "< 15%",
      fiberRatio: "Peat mịn 90% / Fiber 10%",
      waterRetention: "Giữ nước 8–10 lần trọng lượng",
    },
    packaging: "Bao PE 50L hoặc block ép",
    moq: "500 bao / 500 blocks",
    image: "/images/substrate-hoa.jpg",
  },
];

export const productCategories = [
  { id: "all", name: "Tất cả sản phẩm" },
  { id: "Growbag", name: "Growbag" },
  { id: "Cocopeat", name: "Đất mụn dừa" },
  { id: "Block", name: "Cocopeat Block" },
  { id: "Loose", name: "Loose / Bulk" },
  { id: "Substrate", name: "Giá thể chuyên dụng" },
];
