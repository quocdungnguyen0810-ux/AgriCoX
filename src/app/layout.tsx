import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenPeat | AgriCoX – Giải pháp giá thể mụn dừa & nông nghiệp bền vững",
  description:
    "GreenPeat – thương hiệu AgriCoX chuyên sản xuất và xuất khẩu cocopeat growbag, đất mụn dừa xử lý, giá thể nông nghiệp công nghệ cao. Đối tác tin cậy cho nhà kính, thủy canh, nông nghiệp bền vững.",
  keywords:
    "cocopeat, growbag, mụn dừa, giá thể, nông nghiệp, AgriCoX, GreenPeat, xuất khẩu, nhà kính, thủy canh",
  openGraph: {
    title: "GreenPeat | AgriCoX – Giá thể mụn dừa chất lượng cao",
    description:
      "Giải pháp giá thể mụn dừa và công nghệ nông nghiệp bền vững. Xuất khẩu 15+ quốc gia.",
    type: "website",
    locale: "vi_VN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" id="top">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
