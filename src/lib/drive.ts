import { google } from "googleapis";
import { Readable } from "stream";

// Scope for uploading files
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

/**
 * Lấy đối tượng Google Auth (Hỗ trợ cả Service Account và OAuth2)
 */
function getGoogleAuth() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (refreshToken && clientId && clientSecret) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  // Fallback to Service Account
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error(
      "Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY in environment variables."
    );
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
 * Resolve the Google Drive folder ID based on entity type.
 * Falls back to root folder if no specific folder is configured.
 */
export function getEntityFolderId(entityType: string): string | undefined {
  switch (entityType) {
    case "QUOTE":
      return process.env.GOOGLE_DRIVE_FOLDER_ID_QUOTE;
    case "ORDER":
      return process.env.GOOGLE_DRIVE_FOLDER_ID_ORDER;
    case "CONTRACT":
      return process.env.GOOGLE_DRIVE_FOLDER_ID_CONTRACT;
    default:
      return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  }
}

/**
 * Upload một luồng dữ liệu (buffer hoặc stream) lên Google Drive
 * @param fileBuffer - Dữ liệu file dưới dạng Buffer
 * @param fileName - Tên file trên Google Drive
 * @param mimeType - Loại file (ví dụ: application/pdf)
 * @param entityType - Loại entity để xác định thư mục (QUOTE, ORDER, CONTRACT)
 * @returns driveUrl - URL để xem hoặc tải file
 */
export async function uploadFileToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = "application/pdf",
  entityType?: string
): Promise<{ fileId: string; webViewLink: string }> {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: "v3", auth });
    const folderId = entityType
      ? getEntityFolderId(entityType)
      : process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    if (!folderId) {
      console.warn("[drive] No folder ID configured for entity type:", entityType);
      throw new Error("Missing folderId for Google Drive upload.");
    }

    // Convert Buffer to Readable Stream
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType,
      body: stream,
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    if (!response.data.id) {
      throw new Error("Failed to upload file to Google Drive. No ID returned.");
    }

    // Cấp quyền cho ai có link cũng xem được (Tùy chọn, nếu cần public)
    try {
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (permError) {
      console.warn("Failed to set public permission:", permError);
    }

    return {
      fileId: response.data.id,
      webViewLink: response.data.webViewLink as string,
    };
  } catch (error) {
    console.error("Error in uploadFileToDrive:", error);
    throw error;
  }
}

/**
 * Upload file lên Google Drive một cách an toàn — không throw nếu lỗi.
 * Dùng pattern "fire-and-forget" để không block luồng nghiệp vụ chính.
 */
export async function safeUploadToDrive(
  fileBuffer: Buffer,
  fileName: string,
  entityType: string,
  mimeType: string = "application/pdf"
): Promise<string | null> {
  try {
    const folderId = getEntityFolderId(entityType);
    if (!folderId) {
      console.warn(`[drive] Skipping upload — no Drive folder for ${entityType}`);
      return null;
    }
    const result = await uploadFileToDrive(fileBuffer, fileName, mimeType, entityType);
    console.log(`[drive] ✅ Uploaded ${fileName} → ${result.webViewLink}`);
    return result.webViewLink;
  } catch (err) {
    console.error(`[drive] ⚠️ Upload failed for ${fileName}:`, err);
    return null;
  }
}
