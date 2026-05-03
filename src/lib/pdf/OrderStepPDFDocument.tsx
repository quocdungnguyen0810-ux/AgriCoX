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
  page: { padding: 40, fontFamily: 'Roboto', fontSize: 10, lineHeight: 1.5, color: '#111827' },
  header: { marginBottom: 20, textAlign: 'center', borderBottom: 1, borderBottomColor: '#E5E7EB', paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 2, textTransform: 'uppercase', color: '#047857' }, // Emerald for manufacturing/quality
  subtitle: { fontSize: 10, color: '#6B7280' },
  infoSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  infoBox: { width: '48%' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#374151', textTransform: 'uppercase', borderBottom: 1, borderBottomColor: '#F3F4F6', marginBottom: 6, paddingBottom: 2 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 80, fontWeight: 'bold', color: '#6B7280' },
  value: { flex: 1 },
  table: { width: '100%', marginTop: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottom: 1, borderBottomColor: '#E5E7EB', paddingVertical: 4 },
  tableRow: { flexDirection: 'row', borderBottom: 1, borderBottomColor: '#F3F4F6', paddingVertical: 4 },
  cellId: { width: 30, textAlign: 'center' },
  cellSku: { width: 80, paddingLeft: 5 },
  cellName: { flex: 1, paddingLeft: 5 },
  cellQty: { width: 60, textAlign: 'center' },
  cellUnit: { width: 50, textAlign: 'center' },
  cellPack: { width: 100, paddingLeft: 5 },
  cellStatus: { width: 80, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, borderTop: 1, borderTopColor: '#E5E7EB', pt: 10, textAlign: 'center', fontSize: 8, color: '#9CA3AF' },
  signatureSection: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30 },
  signatureBox: { textAlign: 'center', width: '30%' },
  signatureLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 40 },
  signatureName: { fontSize: 9, fontStyle: 'italic' }
});

export type OrderStepType = 
  | 'PRODUCTION_ORDER' 
  | 'QUALITY_CERTIFICATE' 
  | 'PACKING_LIST' 
  | 'WAREHOUSE_RELEASE' 
  | 'DELIVERY_CONFIRMATION'
  | 'PROFORMA_INVOICE'
  | 'PHYTOSANITARY'
  | 'CERTIFICATE_ORIGIN'
  | 'CONTRACT_LIQUIDATION';

interface OrderStepProps {
  type: OrderStepType;
  order: any;
  items: any[];
  qcData?: any; // Quality check data
  warehouseData?: any; // Rack/Bin info
  customData?: any; // Manual edits from SmartDocManager
}

const STEP_CONFIG: Record<OrderStepType, { title: string; subtitle: string; color: string }> = {
  PRODUCTION_ORDER: {
    title: 'LỆNH SẢN XUẤT / PRODUCTION ORDER',
    subtitle: 'Chỉ thị sản xuất dựa trên đơn hàng khách hàng',
    color: '#0369A1' // Blue
  },
  QUALITY_CERTIFICATE: {
    title: 'GIẤY CHỨNG NHẬN CHẤT LƯỢNG / CERTIFICATE OF QUALITY',
    subtitle: 'Xác nhận sản phẩm đạt tiêu chuẩn chất lượng xuất xưởng',
    color: '#047857' // Emerald
  },
  PACKING_LIST: {
    title: 'PHIẾU ĐÓNG GÓI & NHẬP KHO / PACKING LIST & INVENTORY',
    subtitle: 'Chi tiết quy cách đóng gói và lưu kho thành phẩm',
    color: '#B45309' // Amber
  },
  WAREHOUSE_RELEASE: {
    title: 'PHIẾU XUẤT KHO / WAREHOUSE RELEASE SLIP',
    subtitle: 'Xác nhận xuất hàng bàn giao đơn vị vận chuyển',
    color: '#4338CA' // Indigo
  },
  DELIVERY_CONFIRMATION: {
    title: 'BIÊN BẢN BÀN GIAO HÀNG HOÁ / DELIVERY CONFIRMATION',
    subtitle: 'Xác nhận khách hàng đã nhận đầy đủ hàng hoá',
    color: '#BE123C' // Rose
  },
  PROFORMA_INVOICE: {
    title: 'HOÁ ĐƠN SƠ BỘ / PROFORMA INVOICE',
    subtitle: 'Hồ sơ dự thảo cho thủ tục thông quan và thanh toán',
    color: '#0F172A' // Slate
  },
  PHYTOSANITARY: {
    title: 'GIẤY KIỂM DỊCH THỰC VẬT / PHYTOSANITARY CERTIFICATE',
    subtitle: 'Chứng nhận hàng hoá đạt tiêu chuẩn vệ sinh an toàn nông sản',
    color: '#15803D' // Green
  },
  CERTIFICATE_ORIGIN: {
    title: 'CHỨNG NHẬN XUẤT XỨ / CERTIFICATE OF ORIGIN',
    subtitle: 'Xác nhận nguồn gốc sản phẩm từ GreenPeat Việt Nam',
    color: '#1D4ED8' // Blue
  },
  CONTRACT_LIQUIDATION: {
    title: 'BIÊN BẢN THANH LÝ HỢP ĐỒNG / CONTRACT LIQUIDATION',
    subtitle: 'Xác nhận hoàn tất mọi nghĩa vụ trong hợp đồng kinh tế',
    color: '#334155' // Slate
  }
};

export function OrderStepPDFDocument({ type, order, items, qcData, warehouseData, customData }: OrderStepProps) {
  const config = STEP_CONFIG[type];
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN");

  // Merge customData with defaults
  const displayData = {
    orderCode: customData?.orderCode || order.orderCode,
    customerName: customData?.customerName || order.customer?.name || 'Khách lẻ',
    status: customData?.status || order.status,
    assigneeName: customData?.assigneeName || order.assignee?.name || 'GREENPEAT OPS',
    deliveryAddress: customData?.deliveryAddress || order.deliveryAddress || 'Kho GreenPeat',
    standard: customData?.standard || 'TCVN / ISO 9001:2015',
    notes: customData?.notes || '',
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
          <Text style={[styles.subtitle, { marginTop: 4 }]}>Số ĐH / Order No: {displayData.orderCode} | Ngày / Date: {formatDate(null)}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Thông tin Đơn hàng</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Mã ĐH:</Text>
              <Text style={styles.value}>{displayData.orderCode}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Khách hàng:</Text>
              <Text style={styles.value}>{displayData.customerName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Trạng thái:</Text>
              <Text style={styles.value}>{displayData.status}</Text>
            </View>
          </View>
          
          <View style={styles.infoBox}>
            <Text style={styles.sectionTitle}>Thông tin Vận hành</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Người phụ trách:</Text>
              <Text style={styles.value}>{displayData.assigneeName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Địa điểm:</Text>
              <Text style={styles.value}>{displayData.deliveryAddress}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tiêu chuẩn:</Text>
              <Text style={styles.value}>{displayData.standard}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellId}>STT</Text>
            <Text style={styles.cellSku}>Mã SKU</Text>
            <Text style={styles.cellName}>Tên sản phẩm / Quy cách</Text>
            <Text style={styles.cellQty}>SL</Text>
            <Text style={styles.cellUnit}>ĐVT</Text>
            <Text style={styles.cellPack}>Đóng gói / Packing</Text>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.cellId}>{index + 1}</Text>
              <Text style={styles.cellSku}>{item.skuSnapshot || 'N/A'}</Text>
              <Text style={styles.cellName}>{item.productNameSnapshot}</Text>
              <Text style={styles.cellQty}>{item.quantity}</Text>
              <Text style={styles.cellUnit}>{item.unit || 'Bao'}</Text>
              <Text style={styles.cellPack}>{item.packagingSnapshot || 'Tiêu chuẩn'}</Text>
            </View>
          ))}
        </View>

        {/* Technical / QC Details if applicable */}
        {type === 'QUALITY_CERTIFICATE' && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Kết quả kiểm định chất lượng (QC Report)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <View style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Người kiểm định:</Text> {customData?.inspector || 'Phòng QA'}</Text>
              </View>
              <View style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Độ ẩm (Moisture):</Text> {customData?.moisture || '≤ 20%'}</Text>
              </View>
              <View style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Tỷ lệ nảy mầm:</Text> {customData?.germination || '≥ 95%'}</Text>
              </View>
              <View style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Độ tinh khiết:</Text> {customData?.purity || '≥ 99.9%'}</Text>
              </View>
              <View style={{ width: '100%', marginTop: 4 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Kết luận:</Text> Sản phẩm đạt tiêu chuẩn xuất khẩu của GreenPeat.</Text>
              </View>
            </View>
          </View>
        )}

        {type === 'PACKING_LIST' && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>Chi tiết đóng gói & Trọng lượng (Packing Details)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <View style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Tổng số kiện/bao:</Text> {customData?.totalPackages || 'N/A'}</Text>
              </View>
              <View style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Loại bao bì:</Text> {items[0]?.packagingSnapshot || 'Bao GreenPeat'}</Text>
              </View>
              <View style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Trọng lượng tịnh (Net):</Text> {customData?.netWeight || 'N/A'}</Text>
              </View>
              <View style={{ width: '50%', marginBottom: 6 }}>
                <Text style={{ fontSize: 9 }}><Text style={{ fontWeight: 'bold' }}>Trọng lượng tổng (Gross):</Text> {customData?.grossWeight || 'N/A'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Người lập phiếu</Text>
            <Text style={styles.signatureName}>(Ký, ghi rõ họ tên)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Trưởng bộ phận</Text>
            <Text style={styles.signatureName}>(Ký, ghi rõ họ tên)</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Đại diện GreenPeat</Text>
            <Text style={styles.signatureName}>(Ký và đóng dấu)</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Hệ thống quản lý sản xuất AgriCoX - Công nghệ Nông nghiệp Bền vững</Text>
          <Text>Trụ sở: Việt Nam | Website: greenpeat.vn</Text>
        </View>
      </Page>
    </Document>
  );
}
