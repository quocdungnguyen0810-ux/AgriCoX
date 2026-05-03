import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 11, lineHeight: 1.5, color: '#111827' },
  header: { marginBottom: 30, textAlign: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase', color: '#1D4ED8' },
  subtitle: { fontSize: 12, color: '#4B5563' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, backgroundColor: '#F3F4F6', padding: 5 },
  row: { flexDirection: 'row', marginBottom: 4 },
  colLabel: { width: 120, fontWeight: 'bold', color: '#4B5563' },
  colValue: { flex: 1 },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tableHeader: { backgroundColor: '#F9FAFB', fontWeight: 'bold' },
  tableCell: { padding: 5, fontSize: 10, flex: 1, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  tableCellProduct: { padding: 5, fontSize: 10, flex: 3, borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  tableCellLast: { padding: 5, fontSize: 10, flex: 1, textAlign: 'right' },
  summaryRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 },
  summaryLabel: { width: 120, textAlign: 'right', paddingRight: 10, color: '#4B5563' },
  summaryValue: { width: 100, textAlign: 'right', fontWeight: 'bold' },
  totalValue: { width: 100, textAlign: 'right', fontWeight: 'bold', color: '#1D4ED8', fontSize: 14 },
  footer: { marginTop: 40, textAlign: 'center', fontSize: 9, color: '#9CA3AF' }
});

export function OrderPDFDocument({ order }: { order: any }) {
  const formatVND = (n: number) => new Intl.NumberFormat("vi-VN").format(Math.round(n)) + ' ' + (order.currency || 'VND');
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>XÁC NHẬN ĐƠN HÀNG / ORDER CONFIRMATION</Text>
          <Text style={styles.subtitle}>Số / No: {order.orderCode || order.id}</Text>
          <Text style={styles.subtitle}>Ngày / Date: {formatDate(order.createdAt || new Date())}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng / Customer Information</Text>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Khách hàng:</Text>
            <Text style={styles.colValue}>{order.customer?.name || 'Khách lẻ'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Email:</Text>
            <Text style={styles.colValue}>{order.customer?.email || '—'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Số điện thoại:</Text>
            <Text style={styles.colValue}>{order.customer?.phone || '—'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết sản phẩm / Product Details</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellProduct}>Sản phẩm / Product</Text>
              <Text style={styles.tableCell}>SL / Qty</Text>
              <Text style={styles.tableCell}>Đơn giá / Unit Price</Text>
              <Text style={styles.tableCellLast}>Thành tiền / Amount</Text>
            </View>
            {(order.items || []).map((item: any, i: number) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableCellProduct}>{item.productNameSnapshot}</Text>
                <Text style={styles.tableCell}>{item.quantity} {item.unit || 'pcs'}</Text>
                <Text style={styles.tableCell}>{formatVND(item.unitPrice)}</Text>
                <Text style={styles.tableCellLast}>{formatVND(item.totalPrice)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cộng tiền hàng (Subtotal):</Text>
            <Text style={styles.summaryValue}>{formatVND(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Chiết khấu (Discount):</Text>
            <Text style={styles.summaryValue}>-{formatVND(order.discountAmount || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí vận chuyển (Shipping):</Text>
            <Text style={styles.summaryValue}>{formatVND(order.shippingFee || 0)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thuế GTGT (VAT):</Text>
            <Text style={styles.summaryValue}>{formatVND(order.vatAmount || 0)}</Text>
          </View>
          <View style={[styles.summaryRow, { marginTop: 10 }]}>
            <Text style={styles.summaryLabel}>TỔNG CỘNG (TOTAL):</Text>
            <Text style={styles.totalValue}>{formatVND(order.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Điều kiện giao dịch / Transaction Terms</Text>
          {order.paymentTerms && (
            <View style={styles.row}>
              <Text style={styles.colLabel}>Thanh toán:</Text>
              <Text style={styles.colValue}>{order.paymentTerms}</Text>
            </View>
          )}
          {order.deliveryTerms && (
            <View style={styles.row}>
              <Text style={styles.colLabel}>Giao hàng:</Text>
              <Text style={styles.colValue}>{order.deliveryTerms}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text>Cảm ơn quý khách đã tin tưởng và sử dụng sản phẩm của GreenPeat!</Text>
        </View>
      </Page>
    </Document>
  );
}
