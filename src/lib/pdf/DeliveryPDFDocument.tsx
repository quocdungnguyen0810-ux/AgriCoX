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
  logoText: { fontSize: 24, fontFamily: "Roboto-Medium", color: "#f59e0b" },
  title: { fontSize: 24, fontFamily: "Roboto-Medium", color: "#374151", textAlign: "right" },
  row: { flexDirection: "row", marginBottom: 6 },
  label: { width: 120, color: "#6b7280" },
  value: { flex: 1, fontFamily: "Roboto-Medium" },
  table: { marginTop: 20, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#fef3c7", padding: 8, fontFamily: "Roboto-Medium", fontSize: 10, color: "#92400e" },
  tableRow: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb", fontSize: 10 },
  colNo: { width: "5%" },
  colName: { width: "55%" },
  colQty: { width: "20%", textAlign: "center" },
  colUnit: { width: "20%", textAlign: "center" },
  signatures: { marginTop: 80, flexDirection: "row", justifyContent: "space-between" },
  signBox: { alignItems: "center", width: "30%" },
  signTitle: { fontFamily: "Roboto-Medium", marginBottom: 60 },
  signName: { borderTopWidth: 1, borderTopColor: "#d1d5db", paddingTop: 8, width: "100%", textAlign: "center", fontSize: 10 }
});

export const DeliveryPDFDocument = ({ delivery, order }: { delivery: any, order: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logoText}>GREENPEAT LOGISTICS</Text>
          <Text style={{ color: "#6b7280", marginTop: 4 }}>Kho trung tâm: 123 Đường ABC, TP.HCM</Text>
        </View>
        <View>
          <Text style={styles.title}>BIÊN BẢN GIAO NHẬN</Text>
          <Text style={{ textAlign: "right", marginTop: 4, color: "#6b7280" }}>Mã BB: {delivery.deliveryNumber}</Text>
          <Text style={{ textAlign: "right", color: "#6b7280" }}>Ngày: {new Date(delivery.createdAt).toLocaleDateString("vi-VN")}</Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 40, marginBottom: 20 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontFamily: "Roboto-Medium", color: "#d97706", marginBottom: 8, textTransform: "uppercase" }}>Bên Nhận</Text>
          <View style={styles.row}><Text style={styles.label}>Tên KH:</Text><Text style={styles.value}>{order.customer.name}</Text></View>
          {order.customer.companyName && <View style={styles.row}><Text style={styles.label}>Công ty:</Text><Text style={styles.value}>{order.customer.companyName}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Điện thoại:</Text><Text style={styles.value}>{order.customer.phone}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Nơi giao:</Text><Text style={styles.value}>{order.deliveryAddress || "---"}</Text></View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontFamily: "Roboto-Medium", color: "#d97706", marginBottom: 8, textTransform: "uppercase" }}>Vận Chuyển</Text>
          <View style={styles.row}><Text style={styles.label}>Mã đơn hàng:</Text><Text style={styles.value}>{order.orderCode}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Đơn vị VC:</Text><Text style={styles.value}>{delivery.shippingCompany || "Nội bộ"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Biển số xe:</Text><Text style={styles.value}>{delivery.licensePlate || "---"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Tài xế:</Text><Text style={styles.value}>{delivery.driverName || "---"}</Text></View>
        </View>
      </View>

      <Text style={{ marginTop: 10, marginBottom: 10, fontFamily: "Roboto-Medium" }}>Chi tiết hàng hoá bàn giao:</Text>
      
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colNo}>#</Text>
          <Text style={styles.colName}>Sản phẩm / Quy cách</Text>
          <Text style={styles.colQty}>Số lượng</Text>
          <Text style={styles.colUnit}>ĐVT</Text>
        </View>
        {order.items.map((item: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colNo}>{i + 1}</Text>
            <View style={styles.colName}>
              <Text>{item.productNameSnapshot}</Text>
              {item.packagingSnapshot && <Text style={{ color: "#6b7280", marginTop: 2 }}>{item.packagingSnapshot}</Text>}
            </View>
            <Text style={styles.colQty}>{item.quantity}</Text>
            <Text style={styles.colUnit}>{item.unit || "pcs"}</Text>
          </View>
        ))}
      </View>

      <View style={styles.signatures}>
        <View style={styles.signBox}>
          <Text style={styles.signTitle}>Bên Giao (Kho)</Text>
          <Text style={styles.signName}>(Ký, ghi rõ họ tên)</Text>
        </View>
        <View style={styles.signBox}>
          <Text style={styles.signTitle}>Đơn vị Vận chuyển</Text>
          <Text style={styles.signName}>(Ký, ghi rõ họ tên)</Text>
        </View>
        <View style={styles.signBox}>
          <Text style={styles.signTitle}>Khách hàng Nhận</Text>
          <Text style={styles.signName}>(Ký, ghi rõ họ tên)</Text>
        </View>
      </View>
    </Page>
  </Document>
);
