/**
 * RFQ confirmation email — sent to customer after submission.
 */
export function rfqConfirmationEmail(data: {
  rfqCode: string;
  contactName: string;
  items: { productName: string; quantity: number; specification?: string | null }[];
  locale: string;
}): { subject: string; html: string } {
  const isEn = data.locale === "en";

  const subject = isEn
    ? `[AgriCoX] Your RFQ ${data.rfqCode} has been received`
    : `[AgriCoX] Yêu cầu báo giá ${data.rfqCode} đã được tiếp nhận`;

  const itemRows = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${item.productName}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${item.specification || "-"}</td>
        </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#166534,#14532d);padding:24px;border-radius:12px;text-align:center;margin-bottom:24px">
    <h1 style="color:#fff;margin:0;font-size:22px">🌿 GreenPeat AgriCoX</h1>
  </div>

  <h2 style="color:#166534">${isEn ? `Hello ${data.contactName},` : `Xin chào ${data.contactName},`}</h2>

  <p>${isEn
    ? `Your Request for Quotation has been received. Our sales team will contact you within <strong>2 business hours</strong>.`
    : `Yêu cầu báo giá của bạn đã được tiếp nhận. Đội ngũ sales sẽ liên hệ trong vòng <strong>2 giờ làm việc</strong>.`
  }</p>

  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin:20px 0">
    <div style="color:#666;font-size:12px">${isEn ? "RFQ Code" : "Mã RFQ"}</div>
    <div style="font-size:24px;font-weight:bold;color:#166534;font-family:monospace">${data.rfqCode}</div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <thead>
      <tr style="background:#f9fafb">
        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">${isEn ? "Product" : "Sản phẩm"}</th>
        <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e5e7eb">${isEn ? "Qty" : "SL"}</th>
        <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb">${isEn ? "Spec" : "Quy cách"}</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <p style="color:#666;font-size:13px">${isEn
    ? "If you have any questions, please contact us at <strong>sales@greenpeat.vn</strong> or hotline <strong>1900 636 868</strong>."
    : "Nếu cần hỗ trợ, vui lòng liên hệ <strong>sales@greenpeat.vn</strong> hoặc hotline <strong>1900 636 868</strong>."
  }</p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="color:#999;font-size:11px;text-align:center">© ${new Date().getFullYear()} GreenPeat Vietnam | www.greenpeat.vn</p>
</body>
</html>`.trim();

  return { subject, html };
}
