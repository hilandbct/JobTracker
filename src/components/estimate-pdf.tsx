import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatCurrency, formatDate } from "@/lib/format";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 36 },
  title: { fontSize: 24, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  label: { color: "#666", fontSize: 9, marginBottom: 2 },
  tableHeader: { flexDirection: "row", borderBottom: "1 solid #ddd", paddingBottom: 6, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", paddingVertical: 5, borderBottom: "0.5 solid #eee" },
  col1: { flex: 1 },
  col2: { width: 48, textAlign: "right" },
  col3: { width: 64, textAlign: "right" },
  col4: { width: 72, textAlign: "right" },
  total: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalLabel: { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 12 },
  totalValue: { width: 80, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 12 },
  notes: { marginTop: 32, paddingTop: 12, borderTop: "0.5 solid #ddd" },
});

type BizInfo = {
  biz_name?: string;
  biz_email?: string;
  biz_phone?: string;
  biz_address?: string;
  biz_city?: string;
  biz_state?: string;
  biz_zip?: string;
  biz_payment_terms?: string;
};

type Props = {
  logoPath?: string;
  bizInfo?: BizInfo;
  estimate: {
    number: string;
    status: string;
    issueDate: Date | string;
    expiryDate: Date | string | null;
    notes: string | null;
    client: {
      name: string;
      company: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      email: string | null;
    };
    project: { name: string } | null;
    lineItems: { id: number; description: string; quantity: number; unitPrice: number }[];
  };
};

export function EstimatePDF({ estimate, logoPath, bizInfo }: Props) {
  const total = estimate.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View>
            {logoPath && <Image src={logoPath} style={{ width: 48, height: 48, marginBottom: 8 }} />}
            {bizInfo?.biz_name && <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 13, marginBottom: 2 }}>{bizInfo.biz_name}</Text>}
            {bizInfo?.biz_address && <Text style={s.label}>{bizInfo.biz_address}</Text>}
            {(bizInfo?.biz_city || bizInfo?.biz_state) && (
              <Text style={s.label}>{[bizInfo.biz_city, bizInfo.biz_state, bizInfo.biz_zip].filter(Boolean).join(", ")}</Text>
            )}
            {bizInfo?.biz_email && <Text style={s.label}>{bizInfo.biz_email}</Text>}
            {bizInfo?.biz_phone && <Text style={s.label}>{bizInfo.biz_phone}</Text>}
            <Text style={{ ...s.title, marginTop: 16 }}>ESTIMATE</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.label}>Estimate #</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 8 }}>{estimate.number}</Text>
            <Text style={s.label}>Date Issued</Text>
            <Text style={{ marginBottom: 4 }}>{formatDate(estimate.issueDate)}</Text>
            {estimate.expiryDate && (
              <>
                <Text style={s.label}>Valid Until</Text>
                <Text>{formatDate(estimate.expiryDate)}</Text>
              </>
            )}
            <Text style={{ ...s.label, marginTop: 16 }}>Bill To</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{estimate.client.name}</Text>
            {estimate.client.company && <Text style={s.label}>{estimate.client.company}</Text>}
            {estimate.client.address && <Text style={s.label}>{estimate.client.address}</Text>}
            {(estimate.client.city || estimate.client.state) && (
              <Text style={s.label}>{[estimate.client.city, estimate.client.state, estimate.client.zip].filter(Boolean).join(", ")}</Text>
            )}
            {estimate.client.email && <Text style={s.label}>{estimate.client.email}</Text>}
          </View>
        </View>

        <View style={s.tableHeader}>
          <Text style={s.col1}>Description</Text>
          <Text style={s.col2}>Qty</Text>
          <Text style={s.col3}>Unit Price</Text>
          <Text style={s.col4}>Amount</Text>
        </View>

        {estimate.lineItems.map((li, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.col1}>{li.description}</Text>
            <Text style={s.col2}>{li.quantity}</Text>
            <Text style={s.col3}>{formatCurrency(li.unitPrice)}</Text>
            <Text style={s.col4}>{formatCurrency(li.quantity * li.unitPrice)}</Text>
          </View>
        ))}

        <View style={s.total}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{formatCurrency(total)}</Text>
        </View>

        {estimate.notes && (
          <View style={s.notes}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Notes</Text>
            <Text style={{ color: "#444" }}>{estimate.notes}</Text>
          </View>
        )}

        {bizInfo?.biz_payment_terms && (
          <View style={s.notes}>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4 }}>Payment Terms</Text>
            <Text style={{ color: "#444" }}>{bizInfo.biz_payment_terms}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
