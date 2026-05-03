import { google } from 'googleapis';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("=== CHƯƠNG TRÌNH LẤY REFRESH TOKEN TỪ GOOGLE ===\n");
  console.log("BƯỚC 1: Hãy truy cập Google Cloud Console (https://console.cloud.google.com)");
  console.log("BƯỚC 2: Chọn Project của bạn -> API & Services -> Credentials");
  console.log("BƯỚC 3: Tạo Credentials -> OAuth client ID -> Chọn loại 'Desktop App' hoặc 'Web App'");
  console.log("BƯỚC 4: Copy Client ID và Client Secret vào đây.\n");

  const clientId = await askQuestion("Nhập Client ID: ");
  const clientSecret = await askQuestion("Nhập Client Secret: ");

  if (!clientId || !clientSecret) {
    console.error("Vui lòng nhập đầy đủ Client ID và Client Secret.");
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "urn:ietf:wg:oauth:2.0:oob" // Out-of-band auth for CLI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
  });

  console.log("\n=== VUI LÒNG MỞ ĐƯỜNG LINK DƯỚI ĐÂY BẰNG TRÌNH DUYỆT ===");
  console.log(authUrl);
  console.log("=========================================================\n");
  console.log("Đăng nhập bằng tài khoản Gmail của bạn (geot.utc.vn@gmail.com).");
  console.log("Đồng ý cấp quyền, sau đó copy đoạn MÃ XÁC THỰC (Authorization Code) và dán vào đây.\n");

  const code = await askQuestion("Nhập Mã Xác Thực: ");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n=== THÀNH CÔNG! LƯU CÁC THÔNG TIN NÀY VÀO FILE .env ===");
    console.log(`GOOGLE_CLIENT_ID="${clientId}"`);
    console.log(`GOOGLE_CLIENT_SECRET="${clientSecret}"`);
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log("=========================================================\n");
    console.log("Bây giờ hệ thống sẽ sử dụng 15GB Drive của bạn để lưu file PDF thay vì Service Account 0GB.");
  } catch (error) {
    console.error("Lỗi khi lấy token:", error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
