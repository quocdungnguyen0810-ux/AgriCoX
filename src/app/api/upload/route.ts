import { NextRequest, NextResponse } from "next/server";
import { saveFileLocally } from "@/lib/local-storage";
import prisma from "@/lib/prisma";
import { safeUploadToDrive } from "@/lib/drive";
import { appendDocumentRow } from "@/lib/sheets";
import { makeTimestampedFileName } from "@/lib/file-name";

function inferFormat(mimeType: string, fileName: string) {
  const ext = fileName.split(".").pop()?.toUpperCase();
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || ext === "DOCX") return "DOCX";
  if (mimeType.includes("sheet") || ext === "XLSX") return "XLSX";
  if (mimeType.startsWith("image/")) return "IMAGE";
  return ext || "FILE";
}

/**
 * POST /api/upload
 * Nhận file từ FormData và lưu vào public/uploads/{subFolder}
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subFolder = (formData.get("subFolder") as string) || "documents";
    const entityType = (formData.get("entityType") as string | null)?.toUpperCase();
    const entityId = formData.get("entityId") as string | null;
    const documentType = (formData.get("documentType") as string | null) || "ATTACHMENT";
    const referenceCode = (formData.get("referenceCode") as string | null) || entityId || "";
    const note = formData.get("note") as string | null;
    const uploadedBy = formData.get("uploadedBy") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Không có file nào được gửi lên" }, { status: 400 });
    }

    // Đọc file thành Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = makeTimestampedFileName(file.name);

    const result = await saveFileLocally(buffer, fileName, subFolder);
    let finalUrl = result.fileUrl;
    let storageProvider = "LOCAL";

    if (entityType) {
      const driveUrl = await safeUploadToDrive(buffer, fileName, entityType, file.type || "application/octet-stream");
      if (driveUrl) {
        finalUrl = driveUrl;
        storageProvider = "GOOGLE_DRIVE";
      }
    }

    if (entityType && entityId) {
      await prisma.generatedDocument.create({
        data: {
          entityType,
          entityId,
          documentType,
          documentCode: referenceCode,
          format: inferFormat(file.type, file.name),
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileUrl: finalUrl,
          fileSize: file.size,
          storageProvider,
          dataJson: note ? JSON.stringify({ note }) : undefined,
          generatedBy: uploadedBy || undefined,
          status: "GENERATED",
        },
      });

      if (entityType === "CONTRACT") {
        await prisma.contractDocument.create({
          data: {
            contractId: entityId,
            documentType,
            fileName: file.name,
            fileUrl: finalUrl,
            version: 1,
            uploadedBy: uploadedBy || undefined,
          },
        });
      }

      await appendDocumentRow([
        new Date().toISOString(),
        referenceCode,
        documentType,
        file.name,
        finalUrl,
      ]);
    }

    return NextResponse.json({ fileUrl: finalUrl, fileName, storageProvider });
  } catch (error) {
    console.error("[API /upload] Error:", error);
    return NextResponse.json({ error: "Lỗi upload file" }, { status: 500 });
  }
}
