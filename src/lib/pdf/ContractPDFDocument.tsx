import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register font for Vietnamese support
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
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#111827',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 11,
    color: '#4B5563',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  colLabel: {
    width: 140,
    fontWeight: 'bold',
  },
  colValue: {
    flex: 1,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#F9FAFB',
    fontWeight: 'bold',
  },
  tableCol: {
    padding: 4,
  },
  colNo: { width: '5%' },
  colName: { width: '40%' },
  colUnit: { width: '10%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  
  totalsContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginTop: 5,
  },
  totalRow: {
    flexDirection: 'row',
    width: '250pt',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalLabel: {
    width: '150pt',
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    width: '100pt',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#111827',
    marginTop: 4,
    paddingTop: 4,
    fontSize: 12,
    color: '#059669',
  },

  contentBox: {
    border: '1pt solid #E5E7EB',
    padding: 10,
    marginBottom: 15,
  },
  text: {
    marginBottom: 8,
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  signatureBlock: {
    width: '45%',
    alignItems: 'center',
  },
  signatureRole: {
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  signatureImage: {
    width: 120,
    height: 60,
    objectFit: 'contain',
  },
  signatureName: {
    fontWeight: 'bold',
    marginTop: 5,
  },
  signatureTime: {
    fontSize: 8,
    color: '#6B7280',
  }
});

interface PDFProps {
  contract: any; // Using any to avoid complex nested interface mismatch
  customerSignature?: any;
  greenpeatSignature?: any;
}

export function ContractPDFDocument({ contract, customerSignature, greenpeatSignature }: PDFProps) {
  const formatDate = (d: Date | string | null | undefined) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("vi-VN");
  };

  const formatVND = (n: number) => {
    return new Intl.NumberFormat("vi-VN").format(Math.round(n));
  };

  const order = contract.order || {};
  const items = order.items || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>HỢP ĐỒNG MUA BÁN / SALES CONTRACT</Text>
          <Text style={styles.subtitle}>Số / No: {contract.contractCode || contract.id}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Thông tin chung / General Information</Text>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Khách hàng / Customer:</Text>
            <Text style={styles.colValue}>{contract.customer?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Ngày lập / Date:</Text>
            <Text style={styles.colValue}>{formatDate(contract.contractDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Địa điểm / Location:</Text>
            <Text style={styles.colValue}>{contract.deliveryLocation || order.deliveryAddress || "—"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Danh mục hàng hóa / Product List</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, styles.colNo]}>STT</Text>
              <Text style={[styles.tableCol, styles.colName]}>Tên hàng / Description</Text>
              <Text style={[styles.tableCol, styles.colUnit]}>ĐVT</Text>
              <Text style={[styles.tableCol, styles.colQty]}>SL</Text>
              <Text style={[styles.tableCol, styles.colPrice]}>Đơn giá</Text>
              <Text style={[styles.tableCol, styles.colTotal]}>Thành tiền</Text>
            </View>
            {items.map((item: any, idx: number) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colNo]}>{idx + 1}</Text>
                <Text style={[styles.tableCol, styles.colName]}>{item.productNameSnapshot}</Text>
                <Text style={[styles.tableCol, styles.colUnit]}>{item.unit || "pcs"}</Text>
                <Text style={[styles.tableCol, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCol, styles.colPrice]}>{formatVND(item.unitPrice)}</Text>
                <Text style={[styles.tableCol, styles.colTotal]}>{formatVND(item.totalPrice)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tạm tính / Subtotal:</Text>
              <Text style={styles.totalValue}>{formatVND(order.subtotal || 0)} ₫</Text>
            </View>
            {order.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Chiết khấu / Discount:</Text>
                <Text style={styles.totalValue}>-{formatVND(order.discountAmount)} ₫</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Thuế VAT / Tax:</Text>
              <Text style={styles.totalValue}>{formatVND(order.vatAmount || 0)} ₫</Text>
            </View>
            {order.shippingFee > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Vận chuyển / Shipping:</Text>
                <Text style={styles.totalValue}>{formatVND(order.shippingFee)} ₫</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={[styles.totalLabel, { fontWeight: 'bold' }]}>TỔNG CỘNG / TOTAL:</Text>
              <Text style={styles.totalValue}>{formatVND(contract.totalAmount || order.totalAmount || 0)} ₫</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Điều khoản thương mại / Commercial Terms</Text>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Thanh toán / Payment:</Text>
            <Text style={styles.colValue}>{contract.paymentTerms || order.paymentTerms || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.colLabel}>Giao hàng / Delivery:</Text>
            <Text style={styles.colValue}>{contract.deliveryTerms || order.deliveryTerms || "—"}</Text>
          </View>
          {contract.incoterm && (
            <View style={styles.row}>
              <Text style={styles.colLabel}>Incoterm:</Text>
              <Text style={styles.colValue}>{contract.incoterm}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Nội dung chi tiết / Detailed Clauses</Text>
          <View style={styles.contentBox}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>[Vietnamese]</Text>
            <Text style={styles.text}>{contract.contentVi || "Nội dung hợp đồng đang được cập nhật."}</Text>
          </View>
          {contract.contentEn && (
            <View style={styles.contentBox}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>[English]</Text>
              <Text style={styles.text}>{contract.contentEn}</Text>
            </View>
          )}
        </View>

        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureRole}>ĐẠI DIỆN BÊN MUA (BUYER)</Text>
            {customerSignature?.status === "SIGNED" ? (
              <>
                {customerSignature.signatureImageUrl ? (
                  <Image src={customerSignature.signatureImageUrl} style={styles.signatureImage} />
                ) : (
                  <Text style={{ fontSize: 16, marginBottom: 5 }}>{customerSignature.signerName}</Text>
                )}
                <Text style={styles.signatureName}>{customerSignature.signerName}</Text>
                <Text style={styles.signatureTime}>Ký lúc: {formatDate(customerSignature.signedAt)}</Text>
              </>
            ) : (
              <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>(Chưa ký / Not signed)</Text>
            )}
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureRole}>ĐẠI DIỆN BÊN BÁN (SELLER)</Text>
            {greenpeatSignature?.status === "SIGNED" ? (
              <>
                {greenpeatSignature.signatureImageUrl ? (
                  <Image src={greenpeatSignature.signatureImageUrl} style={styles.signatureImage} />
                ) : (
                  <Text style={{ fontSize: 16, marginBottom: 5 }}>{greenpeatSignature.signerName}</Text>
                )}
                <Text style={styles.signatureName}>{greenpeatSignature.signerName}</Text>
                <Text style={styles.signatureTime}>Ký lúc: {formatDate(greenpeatSignature.signedAt)}</Text>
              </>
            ) : (
              <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>(Chưa ký / Not signed)</Text>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
}
