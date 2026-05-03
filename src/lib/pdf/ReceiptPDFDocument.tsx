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
  page: { padding: 40, fontFamily: "Roboto", fontSize: 12, color: "#333", backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 15 },
  logoText: { fontSize: 24, fontFamily: "Roboto-Medium", color: "#10b981" },
  receiptTitle: { fontSize: 28, fontFamily: "Roboto-Medium", color: "#374151", textAlign: "right" },
  row: { flexDirection: "row", marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", borderStyle: "dashed" },
  label: { width: 140, color: "#6b7280" },
  value: { flex: 1, fontFamily: "Roboto-Medium" },
  amountBox: { marginTop: 20, backgroundColor: "#ecfdf5", padding: 15, borderRadius: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amountLabel: { fontSize: 14, color: "#065f46" },
  amountValue: { fontSize: 24, fontFamily: "Roboto-Medium", color: "#059669" },
  signatures: { marginTop: 60, flexDirection: "row", justifyContent: "space-around" },
  signBox: { alignItems: "center" },
  signTitle: { fontFamily: "Roboto-Medium", marginBottom: 60 },
  signName: { borderTopWidth: 1, borderTopColor: "#d1d5db", paddingTop: 8, minWidth: 120, textAlign: "center" }
});

export const ReceiptPDFDocument = ({ receipt, order }: { receipt: any, order: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>GREENPEAT</Text>
          <Text style={{ color: "#6b7280", marginTop: 4 }}>Số 123, Đường ABC, TP.HCM</Text>
        </View>
        <View>
          <Text style={styles.receiptTitle}>BIÊN LAI THU TIỀN</Text>
          <Text style={{ textAlign: "right", marginTop: 4, color: "#6b7280" }}>Mã BL: {receipt.receiptNumber}</Text>
          <Text style={{ textAlign: "right", color: "#6b7280" }}>Ngày: {new Date(receipt.paymentDate).toLocaleDateString("vi-VN")}</Text>
        </View>
      </View>

      <View style={{ marginTop: 20 }}>
        <View style={styles.row}>
          <Text style={styles.label}>Tên người nộp tiền:</Text>
          <Text style={styles.value}>{order.customer.name}</Text>
        </View>
        {order.customer.companyName && (
          <View style={styles.row}>
            <Text style={styles.label}>Đơn vị:</Text>
            <Text style={styles.value}>{order.customer.companyName}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Số điện thoại:</Text>
          <Text style={styles.value}>{order.customer.phone}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Thuộc đơn hàng:</Text>
          <Text style={styles.value}>{order.orderCode}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Hình thức thanh toán:</Text>
          <Text style={styles.value}>{receipt.paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản"}</Text>
        </View>
        {receipt.referenceCode && (
          <View style={styles.row}>
            <Text style={styles.label}>Mã giao dịch / UNC:</Text>
            <Text style={styles.value}>{receipt.referenceCode}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Lý do thu:</Text>
          <Text style={styles.value}>{receipt.note || `Thanh toán cho đơn hàng ${order.orderCode}`}</Text>
        </View>
      </View>

      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Số tiền thu:</Text>
        <Text style={styles.amountValue}>{formatVND(receipt.amount)} VNĐ</Text>
      </View>

      <View style={styles.signatures}>
        <View style={styles.signBox}>
          <Text style={styles.signTitle}>Người nộp tiền</Text>
          <Text style={styles.signName}>(Ký, ghi rõ họ tên)</Text>
        </View>
        <View style={styles.signBox}>
          <Text style={styles.signTitle}>Người thu tiền</Text>
          <Text style={styles.signName}>(Ký, ghi rõ họ tên)</Text>
        </View>
      </View>
    </Page>
  </Document>
);
