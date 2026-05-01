/**
 * PDF Utilities — Shared React PDF Components
 * ─────────────────────────────────────────────
 * Reusable components for building professional PDF documents
 * using @react-pdf/renderer. Server-side only, no browser needed.
 *
 * Vietnamese font: Roboto (Google Fonts, free, Vietnamese-complete).
 * Phase 6A.6.
 */

import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

// ═══════════════════════════════════════════════════════
// FONT REGISTRATION — Vietnamese-compatible Roboto
// ═══════════════════════════════════════════════════════

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWubEbWmT.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v51/KFOMCnqEu92Fr1ME7kSn66aGLdTylUAMQXC89YmC2DPNWuYjammT.ttf",
      fontWeight: 700,
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v51/KFOKCnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmOClHrs6ljXfMMLoHQiA8.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
  ],
});

// Disable hyphenation for Vietnamese text
Font.registerHyphenationCallback((word) => [word]);

// ═══════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════

const COLOR_BRAND = "#2D5F2D";
const COLOR_DARK = "#1A1A1A";
const COLOR_GRAY = "#666666";
const COLOR_LIGHT_GRAY = "#F5F5F5";
const COLOR_BORDER = "#CCCCCC";
const COLOR_WHITE = "#FFFFFF";

// ═══════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════

const s = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: COLOR_DARK,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  // Header
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: COLOR_BRAND,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 700,
    color: COLOR_BRAND,
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 7,
    color: COLOR_GRAY,
    marginBottom: 1,
  },
  // Title
  titleBlock: {
    marginVertical: 15,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: COLOR_BRAND,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLOR_GRAY,
    textAlign: "center",
    marginTop: 2,
  },
  // Section
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: COLOR_BRAND,
    marginTop: 12,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BRAND,
  },
  // Metadata
  metaRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  metaLabel: {
    fontWeight: 700,
    fontSize: 8,
    width: 130,
    color: COLOR_DARK,
  },
  metaValue: {
    fontSize: 8,
    color: COLOR_DARK,
    flex: 1,
  },
  // Table
  table: {
    marginVertical: 8,
    borderWidth: 0.5,
    borderColor: COLOR_BORDER,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR_BORDER,
    minHeight: 18,
    alignItems: "center",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLOR_BRAND,
    minHeight: 22,
    alignItems: "center",
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 700,
    color: COLOR_WHITE,
    paddingHorizontal: 3,
    paddingVertical: 3,
    textAlign: "center",
  },
  tableCell: {
    fontSize: 7.5,
    paddingHorizontal: 3,
    paddingVertical: 2,
    color: COLOR_DARK,
  },
  tableCellRight: {
    textAlign: "right",
  },
  tableCellCenter: {
    textAlign: "center",
  },
  tableRowAlt: {
    backgroundColor: COLOR_LIGHT_GRAY,
  },
  // Totals
  totalsBlock: {
    marginTop: 8,
    marginLeft: "50%",
  },
  totalsRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  totalsLabel: {
    fontWeight: 700,
    fontSize: 8,
    width: 120,
    textAlign: "right",
    paddingRight: 8,
  },
  totalsValue: {
    fontSize: 8,
    width: 100,
    textAlign: "right",
  },
  totalsBold: {
    fontWeight: 700,
    fontSize: 9,
    color: COLOR_BRAND,
  },
  amountInWords: {
    fontSize: 8,
    fontStyle: "italic",
    marginTop: 4,
    marginBottom: 8,
  },
  // Paragraph
  paragraph: {
    fontSize: 8,
    lineHeight: 1.5,
    marginBottom: 4,
    color: COLOR_DARK,
  },
  // Signature
  signatureBlock: {
    flexDirection: "row",
    marginTop: 30,
    justifyContent: "space-between",
  },
  signatureColumn: {
    width: "45%",
    alignItems: "center",
  },
  signatureTitle: {
    fontWeight: 700,
    fontSize: 9,
    marginBottom: 4,
    textAlign: "center",
  },
  signatureHint: {
    fontSize: 7,
    fontStyle: "italic",
    color: COLOR_GRAY,
    marginBottom: 40,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: COLOR_BORDER,
    paddingTop: 5,
  },
  footerText: {
    fontSize: 6,
    color: COLOR_GRAY,
  },
  // Spacer
  spacer: {
    height: 10,
  },
});

// ═══════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════

interface CompanyInfo {
  fullName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
}

export function PdfHeader({ company }: { company: CompanyInfo }) {
  return (
    <View style={s.header}>
      <Text style={s.companyName}>{company.fullName}</Text>
      <Text style={s.companyDetail}>Địa chỉ: {company.address}</Text>
      <Text style={s.companyDetail}>
        ĐT: {company.phone} | Email: {company.email}
        {company.website ? ` | Web: ${company.website}` : ""}
      </Text>
    </View>
  );
}

export function PdfTitle({
  main,
  sub,
}: {
  main: string;
  sub?: string;
}) {
  return (
    <View style={s.titleBlock}>
      <Text style={s.title}>{main}</Text>
      {sub && <Text style={s.subtitle}>{sub}</Text>}
    </View>
  );
}

export function PdfSectionTitle({ text }: { text: string }) {
  return <Text style={s.sectionTitle}>{text}</Text>;
}

export function PdfText({
  children,
  bold,
  italic,
}: {
  children: string;
  bold?: boolean;
  italic?: boolean;
}) {
  return (
    <Text
      style={[
        s.paragraph,
        bold ? { fontWeight: 700 } : {},
        italic ? { fontStyle: "italic" } : {},
      ]}
    >
      {children}
    </Text>
  );
}

export function PdfMetadataRows({
  rows,
}: {
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <View>
      {rows.map((r, i) => (
        <View key={i} style={s.metaRow}>
          <Text style={s.metaLabel}>{r.label}</Text>
          <Text style={s.metaValue}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function PdfTable({
  headers,
  rows,
  colWidths,
}: {
  headers: string[];
  rows: string[][];
  colWidths: string[];
}) {
  return (
    <View style={s.table}>
      {/* Header */}
      <View style={s.tableHeaderRow}>
        {headers.map((h, i) => (
          <Text
            key={i}
            style={[s.tableHeaderCell, { width: colWidths[i] }]}
          >
            {h}
          </Text>
        ))}
      </View>
      {/* Data */}
      {rows.map((row, ri) => (
        <View
          key={ri}
          style={[s.tableRow, ri % 2 === 1 ? s.tableRowAlt : {}]}
        >
          {row.map((cell, ci) => {
            // Right-align numeric columns (after STT, typically price/qty columns)
            const isNumeric = ci >= 5 && ci <= 8;
            const isCenter = ci === 0; // STT
            return (
              <Text
                key={ci}
                style={[
                  s.tableCell,
                  { width: colWidths[ci] },
                  isNumeric ? s.tableCellRight : {},
                  isCenter ? s.tableCellCenter : {},
                ]}
              >
                {cell}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function PdfTotalsBlock({
  rows,
  amountInWords,
}: {
  rows: Array<{ label: string; value: string; bold?: boolean }>;
  amountInWords?: string;
}) {
  return (
    <View>
      <View style={s.totalsBlock}>
        {rows.map((r, i) => (
          <View key={i} style={s.totalsRow}>
            <Text style={[s.totalsLabel, r.bold ? s.totalsBold : {}]}>
              {r.label}
            </Text>
            <Text style={[s.totalsValue, r.bold ? s.totalsBold : {}]}>
              {r.value}
            </Text>
          </View>
        ))}
      </View>
      {amountInWords && (
        <Text style={s.amountInWords}>Bằng chữ: {amountInWords}</Text>
      )}
    </View>
  );
}

export function PdfSignatureBlock({
  leftTitle,
  rightTitle,
}: {
  leftTitle: string;
  rightTitle: string;
}) {
  return (
    <View style={s.signatureBlock}>
      <View style={s.signatureColumn}>
        <Text style={s.signatureTitle}>{leftTitle}</Text>
        <Text style={s.signatureHint}>(Ký, ghi rõ họ tên)</Text>
      </View>
      <View style={s.signatureColumn}>
        <Text style={s.signatureTitle}>{rightTitle}</Text>
        <Text style={s.signatureHint}>(Ký, ghi rõ họ tên)</Text>
      </View>
    </View>
  );
}

export function PdfFooter({
  code,
  pageLabel,
}: {
  code: string;
  pageLabel?: string;
}) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{code}</Text>
      <Text style={s.footerText}>
        {pageLabel || "AgriCoX Document System"}
      </Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) =>
          `Trang ${pageNumber}/${totalPages}`
        }
      />
    </View>
  );
}

export function PdfSpacer() {
  return <View style={s.spacer} />;
}

// ═══════════════════════════════════════════════════════
// DOCUMENT WRAPPER
// ═══════════════════════════════════════════════════════

/**
 * Wrap children in a standard A4 Page with header and footer.
 */
export function PdfPage({
  children,
  company,
  code,
}: {
  children: React.ReactNode;
  company: CompanyInfo;
  code: string;
}) {
  return (
    <Page size="A4" style={s.page}>
      <PdfHeader company={company} />
      {children}
      <PdfFooter code={code} />
    </Page>
  );
}

// ═══════════════════════════════════════════════════════
// TEXT HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Ensure a value is a safe non-empty string for PDF rendering.
 */
export function safePdfText(
  value: string | null | undefined,
  fallback: string = "—"
): string {
  if (value == null) return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

// ═══════════════════════════════════════════════════════
// BUFFER EXPORT
// ═══════════════════════════════════════════════════════

/**
 * Render a React PDF Document element to a Buffer.
 */
export async function createPdfBuffer(
  element: React.ReactElement
): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);
  return Buffer.from(buffer);
}

// Re-export Document for generators
export { Document };
