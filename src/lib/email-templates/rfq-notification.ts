/**
 * Internal RFQ notification email — sent to sales/admin team.
 * Always in Vietnamese (internal communication).
 */
export function rfqNotificationEmail(data: {
  rfqCode: string;
  contactName: string;
  companyName?: string | null;
  contactPhone: string;
  contactEmail?: string | null;
  items: { productName: string; quantity: number; specification?: string | null }[];
  message?: string | null;
}): { subject: string; html: string } {
  const subject = `[RFQ Mới] ${data.rfqCode} – ${data.contactName}${data.companyName ? ` (${data.companyName})` : ""}`;

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${item.productName}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb">${item.specification || "-"}</td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#dc2626;padding:16px;border-radius:8px;text-align:center;margin-bottom:20px">
    <h2 style="color:#fff;margin:0">🔔 RFQ Mới: ${data.rfqCode}</h2>
  </div>

  <h3>Thông tin khách hàng</h3>
  <table style="width:100%;margin-bottom:16px">
    <tr><td style="padding:4px 0;color:#666;width:120px">Họ tên:</td><td><strong>${data.contactName}</strong></td></tr>
    ${data.companyName ? `<tr><td style="padding:4px 0;color:#666">Công ty:</td><td>${data.companyName}</td></tr>` : ""}
    <tr><td style="padding:4px 0;color:#666">Điện thoại:</td><td><a href="tel:${data.contactPhone}">${data.contactPhone}</a></td></tr>
    ${data.contactEmail ? `<tr><td style="padding:4px 0;color:#666">Email:</td><td><a href="mailto:${data.contactEmail}">${data.contactEmail}</a></td></tr>` : ""}
  </table>

  <h3>Sản phẩm yêu cầu</h3>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <thead>
      <tr style="background:#f9fafb">
        <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #e5e7eb">Sản phẩm</th>
        <th style="padding:6px 10px;text-align:center;border-bottom:2px solid #e5e7eb">SL</th>
        <th style="padding:6px 10px;text-align:left;border-bottom:2px solid #e5e7eb">Quy cách</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  ${data.message ? `<h3>Ghi chú</h3><p style="background:#f9fafb;padding:12px;border-radius:6px">${data.message}</p>` : ""}

  <div style="margin-top:24px;text-align:center">
    <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/quotes"
       style="display:inline-block;padding:10px 24px;background:#166534;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
      Xem trên Admin →
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#999;font-size:11px;text-align:center">Email tự động từ hệ thống AgriCoX</p>
</body>
</html>`.trim();

  return { subject, html };
}
