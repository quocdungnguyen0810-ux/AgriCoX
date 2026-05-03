import fs from "fs";
import path from "path";
import { sanitizeFileName } from "@/lib/file-name";

/**
 * Lưu file vào thư mục local (public/uploads)
 * @param fileBuffer - Dữ liệu file dưới dạng Buffer
 * @param fileName - Tên file
 * @param subFolder - Thư mục con (ví dụ: "quotes", "orders", "contracts")
 * @returns fileUrl - URL công khai để truy cập file
 */
export async function saveFileLocally(
  fileBuffer: Buffer,
  fileName: string,
  subFolder: string
): Promise<{ fileUrl: string }> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeName = sanitizeFileName(fileName);
  const filePath = path.join(uploadDir, safeName);
  await fs.promises.writeFile(filePath, fileBuffer);

  return {
    fileUrl: `/uploads/${subFolder}/${encodeURIComponent(safeName)}`
  };
}
