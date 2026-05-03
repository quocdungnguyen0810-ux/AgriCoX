import { google } from "googleapis";
import prisma from "@/lib/prisma";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

/**
 * Lưu job thất bại vào DB để retry sau — "Never lose data" pattern.
 */
async function saveFailed(jobType: string, payload: unknown, error: unknown) {
  try {
    await prisma.failedSyncJob.create({
      data: {
        jobType,
        payload: JSON.stringify(payload),
        errorMsg: error instanceof Error ? error.message : String(error),
      },
    });
  } catch (dbErr) {
    // Last resort: log to stderr (e.g., DB also down)
    console.error("[sheets] CRITICAL: Cannot save failed sync job to DB:", dbErr);
  }
}

async function appendToSheet(sheetId: string, range: string, values: string[]) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [values] },
  });
}

/**
 * Thêm 1 dòng vào danh sách Báo Giá.
 * Columns: Thời gian | Mã BG | Tên Khách | Email | Tổng Tiền | Trạng thái | Link PDF
 */
export async function appendQuoteRow(values: string[]) {
  const sheetId = process.env.GOOGLE_SHEET_QUOTE_ID;
  if (!sheetId) return; // Chưa cấu hình — bỏ qua an toàn

  try {
    await appendToSheet(sheetId, "A:G", values);
  } catch (err) {
    console.error("[sheets] appendQuoteRow failed, saving to retry queue:", err);
    await saveFailed("SHEET_QUOTE", values, err);
  }
}

/**
 * Thêm 1 dòng vào danh sách Đơn Hàng.
 * Columns: Thời gian | Mã ĐH | Mã BG | Tên Khách | Tổng Tiền | Trạng thái
 */
export async function appendOrderRow(values: string[]) {
  const sheetId = process.env.GOOGLE_SHEET_ORDER_ID;
  if (!sheetId) return;

  try {
    await appendToSheet(sheetId, "A:F", values);
  } catch (err) {
    console.error("[sheets] appendOrderRow failed, saving to retry queue:", err);
    await saveFailed("SHEET_ORDER", values, err);
  }
}

/**
 * Thêm 1 dòng vào danh sách Hợp Đồng.
 * Columns: Thời gian | Mã HĐ | Tên Khách | Tổng Tiền | Trạng thái | Link PDF Drive
 */
export async function appendContractRow(values: string[]) {
  const sheetId = process.env.GOOGLE_SHEET_CONTRACT_ID;
  if (!sheetId) return;

  try {
    await appendToSheet(sheetId, "A:F", values);
  } catch (err) {
    console.error("[sheets] appendContractRow failed, saving to retry queue:", err);
    await saveFailed("SHEET_CONTRACT", values, err);
  }
}

/**
 * Thêm 1 dòng vào danh sách Quản lý File/Chứng từ.
 * Columns: Thời gian | Mã tham chiếu | Loại File | Tên File | Link Tải
 */
export async function appendDocumentRow(values: string[]) {
  const sheetId = process.env.GOOGLE_SHEET_DOCUMENT_ID;
  if (!sheetId) return;

  try {
    await appendToSheet(sheetId, "A:E", values);
  } catch (err) {
    console.error("[sheets] appendDocumentRow failed, saving to retry queue:", err);
    await saveFailed("SHEET_DOCUMENT", values, err);
  }
}

/**
 * Retry tất cả các job chưa xử lý trong FailedSyncJob.
 * Gọi thủ công hoặc từ một API route /api/admin/retry-sync.
 */
export async function retryFailedJobs(): Promise<{ retried: number; resolved: number; stillFailed: number }> {
  const jobs = await prisma.failedSyncJob.findMany({
    where: { resolved: false, retries: { lt: 5 } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  let resolved = 0;
  let stillFailed = 0;

  for (const job of jobs) {
    try {
      const values: string[] = JSON.parse(job.payload);

      if (job.jobType === "SHEET_QUOTE") {
        const sheetId = process.env.GOOGLE_SHEET_QUOTE_ID!;
        await appendToSheet(sheetId, "A:G", values);
      } else if (job.jobType === "SHEET_ORDER") {
        const sheetId = process.env.GOOGLE_SHEET_ORDER_ID!;
        await appendToSheet(sheetId, "A:F", values);
      } else if (job.jobType === "SHEET_CONTRACT") {
        const sheetId = process.env.GOOGLE_SHEET_CONTRACT_ID!;
        await appendToSheet(sheetId, "A:F", values);
      }

      await prisma.failedSyncJob.update({
        where: { id: job.id },
        data: { resolved: true },
      });
      resolved++;
    } catch (err) {
      await prisma.failedSyncJob.update({
        where: { id: job.id },
        data: {
          retries: { increment: 1 },
          errorMsg: err instanceof Error ? err.message : String(err),
        },
      });
      stillFailed++;
    }
  }

  return { retried: jobs.length, resolved, stillFailed };
}
