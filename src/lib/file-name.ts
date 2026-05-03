export function sanitizeFileName(fileName: string, fallback = "document"): string {
  const baseName = fileName.split(/[\\/]/).pop()?.trim() || fallback;
  const sanitized = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitized || fallback;
}

export function makeTimestampedFileName(fileName: string): string {
  return `${Date.now()}_${sanitizeFileName(fileName)}`;
}
