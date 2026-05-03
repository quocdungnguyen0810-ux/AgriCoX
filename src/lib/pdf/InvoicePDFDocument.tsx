import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { formatVND } from "../quote-calculation";

Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
});
Font.register({
  family: "Roboto-Medium",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf",
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Roboto", fontSize: 11, color: "#333", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 15 },
  logoText: { fontSize: 24, fontFamily: "Roboto-Medium", color: "#6366f1" },
  invoiceTitle: { fontSize: 28, fontFamily: "Roboto-Medium", color: "#374151", textAlign: "right", letterSpacing: 2 },
  sectionTitle: { fontSize: 13, fontFamily: "Roboto-Medium", color: "#4f46e5", marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 100, color: "#6b7280" },
  value: { flex: 1, fontFamily: "Roboto-Medium" },
  table: { marginTop: 20, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", padding: 8, fontFamily: "Roboto-Medium", fontSize: 10, color: "#374151" },
  tableRow: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb", fontSize: 10 },
  colNo: { width: "5%" },
  colName: { width: "40%" },
  colQty: { width: "10%", textAlign: "center" },
  colUnit: { width: "10%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  totalsBox: { marginTop: 15, alignSelf: "flex-end", width: "40%" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  totalLabel: { color: "#6b7280" },
  totalValue: { fontFamily: "Roboto-Medium" },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", marginTop: 5, paddingTop: 5, borderTopWidth: 1, borderTopColor: "#e5e7eb", fontSize: 14, fontFamily: "Roboto-Medium", color: "#6366f1" },
  footer: { marginTop: 50, textAlign: "center", color: "#9ca3af", fontSize: 9, borderTopWidth: 1, borderTopColor: "#eee", paddingTop: 10 }
});

export const InvoicePDFDocument = ({ invoice, order }: { invoice: any, order: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>GREENPEAT</Text>
          <Text style={{ color: "#6b7280", marginTop: 4 }}>Số 123, Đường ABC, TP.HCM</Text>
          <Text style={{ color: "#6b7280" }}>MST: 0101234567</Text>
        </View>
        <View>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={{ textAlign: "right", marginTop: 4, color: "#6b7280" }}>No: {invoice.invoiceNumber}</Text>
          <Text style={{ textAlign: "right", color: "#6b7280" }}>Date: {new Date(invoice.issueDate).toLocaleDateString("vi-VN")}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 40, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Bill To</Text>
          <View style={styles.row}><Text style={styles.label}>Tên KH:</Text><Text style={styles.value}>{order.customer.name}</Text></View>
          {order.customer.companyName && <View style={styles.row}><Text style={styles.label}>Công ty:</Text><Text style={styles.value}>{order.customer.companyName}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Điện thoại:</Text><Text style={styles.value}>{order.customer.phone}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Địa chỉ:</Text><Text style={styles.value}>{order.deliveryAddress || "---"}</Text></View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Order Info</Text>
          <View style={styles.row}><Text style={styles.label}>Mã đơn hàng:</Text><Text style={styles.value}>{order.orderCode}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Tiền tệ:</Text><Text style={styles.value}>{order.currency}</Text></View>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colNo}>#</Text>
          <Text style={styles.colName}>Sản phẩm</Text>
          <Text style={styles.colQty}>SL</Text>
          <Text style={styles.colUnit}>ĐVT</Text>
          <Text style={styles.colPrice}>Đơn giá</Text>
          <Text style={styles.colTotal}>Thành tiền</Text>
        </View>
        {order.items.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colNo}>{i + 1}</Text>
            <Text style={styles.colName}>{item.productNameSnapshot}</Text>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{item.unit || "pcs"}</Text>
            <Text style={styles.colPrice}>{formatVND(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatVND(item.totalPrice)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totalsBox}>
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Tạm tính:</Text><Text style={styles.totalValue}>{formatVND(order.subtotal)} ₫</Text></View>
        {order.discountAmount > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>Chiết khấu:</Text><Text style={styles.totalValue}>-{formatVND(order.discountAmount)} ₫</Text></View>}
        <View style={styles.totalRow}><Text style={styles.totalLabel}>Thuế VAT:</Text><Text style={styles.totalValue}>{formatVND(invoice.taxAmount)} ₫</Text></View>
        {order.shippingFee > 0 && <View style={styles.totalRow}><Text style={styles.totalLabel}>Vận chuyển:</Text><Text style={styles.totalValue}>{formatVND(order.shippingFee)} ₫</Text></View>}
        <View style={styles.grandTotal}><Text>TỔNG CỘNG:</Text><Text>{formatVND(invoice.totalAmount)} ₫</Text></View>
      </View>

      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>If you have any questions concerning this invoice, contact {order.assignee?.email || "info@greenpeat.com"}</Text>
      </View>
    </Page>
  </Document>
);
