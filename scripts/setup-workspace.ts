import { google } from "googleapis";
import "dotenv/config";
import fs from "fs";
import path from "path";

// Cần quyền tạo file/folder trên Drive và tạo/sửa Spreadsheets
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/spreadsheets",
];

function getAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY in .env");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

async function createFolder(drive: any, folderName: string, parentFolderId: string) {
  const fileMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentFolderId],
  };
  const folder = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, webViewLink",
  });
  console.log(`📂 Tạo thư mục "${folderName}" thành công: ${folder.data.webViewLink}`);
  return folder.data.id;
}

async function createSheetInFolder(drive: any, sheets: any, sheetName: string, folderId: string, headers: string[]) {
  // Tạo spreadsheet TRỰC TIẾP trong thư mục bằng Drive API (tránh lỗi 403 phân quyền)
  const fileMetadata = {
    name: sheetName,
    mimeType: "application/vnd.google-apps.spreadsheet",
    parents: [folderId],
  };
  const file = await drive.files.create({
    requestBody: fileMetadata,
    fields: "id, webViewLink",
  });
  
  const sheetId = file.data.id;
  console.log(`📊 Tạo Sheet "${sheetName}" thành công: ${file.data.webViewLink}`);

  // Ghi Headers (Tiêu đề cột)
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [headers],
    },
  });
  
  // Format Header in đậm (Tùy chọn)
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { textFormat: { bold: true } } },
            fields: "userEnteredFormat.textFormat.bold",
          }
        }]
      }
    });
  } catch (e) {
    console.log("  (Warning: Không thể in đậm header)");
  }

  return sheetId;
}

async function main() {
  try {
    const auth = getAuth();
    const drive = google.drive({ version: "v3", auth });
    const sheets = google.sheets({ version: "v4", auth });

    const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (!rootFolderId) {
      console.error("❌ LỖI: Cần cung cấp biến GOOGLE_DRIVE_ROOT_FOLDER_ID trong file .env");
      console.error("   Đây là ID của thư mục trên Drive cá nhân của bạn, đã được Share quyền Editor cho Service Account.");
      process.exit(1);
    }

    console.log("🚀 Bắt đầu tự động khởi tạo cấu trúc dữ liệu trên Google Workspace...\n");

    // 1. Tạo thư mục Báo Giá
    const quoteFolderId = await createFolder(drive, "Báo giá", rootFolderId);
    const quoteSheetId = await createSheetInFolder(drive, sheets, "Danh sách Báo Giá", quoteFolderId, 
      ["Thời gian tạo", "Mã Báo Giá", "Tên Khách Hàng", "Email", "Tổng Tiền", "Trạng thái", "Link PDF"]
    );

    // 2. Tạo thư mục Đơn Hàng
    const orderFolderId = await createFolder(drive, "Đơn hàng", rootFolderId);
    const orderSheetId = await createSheetInFolder(drive, sheets, "Danh sách Đơn Hàng", orderFolderId, 
      ["Thời gian tạo", "Mã Đơn Hàng", "Mã Báo Giá", "Tên Khách Hàng", "Tổng Tiền", "Trạng thái"]
    );

    // 3. Tạo thư mục Hợp Đồng
    const contractFolderId = await createFolder(drive, "Hợp đồng", rootFolderId);
    const contractSheetId = await createSheetInFolder(drive, sheets, "Danh sách Hợp Đồng", contractFolderId, 
      ["Thời gian ký", "Mã Hợp Đồng", "Tên Khách Hàng", "Email", "Tổng Tiền", "Trạng thái", "Link PDF Hợp Đồng"]
    );

    console.log("\n🎉 HOÀN TẤT! Hãy copy các dòng sau và thêm vào file .env của bạn:\n");
    console.log(`GOOGLE_DRIVE_FOLDER_ID_QUOTE="${quoteFolderId}"`);
    console.log(`GOOGLE_SHEET_QUOTE_ID="${quoteSheetId}"`);
    console.log(`GOOGLE_DRIVE_FOLDER_ID_ORDER="${orderFolderId}"`);
    console.log(`GOOGLE_SHEET_ORDER_ID="${orderSheetId}"`);
    console.log(`GOOGLE_DRIVE_FOLDER_ID_CONTRACT="${contractFolderId}"`);
    console.log(`GOOGLE_SHEET_CONTRACT_ID="${contractSheetId}"`);
    console.log("\n(Và đừng quên thay đổi biến GOOGLE_DRIVE_FOLDER_ID cũ thành các biến cụ thể ở trên trong code upload file nhé!)\n");

  } catch (error: any) {
    console.error("❌ Lỗi trong quá trình tạo Workspace:");
    console.error(error);
  }
}

main();
