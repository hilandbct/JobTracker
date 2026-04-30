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

type Props = {
  logoPath?: string;
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

export function EstimatePDF({ estimate, logoPath }: Props) {
  const total = estimate.lineItems.reduce((s, li) => s + li.quantity * li.unitPrice, 0);

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View>
            {logoPath && <Image src={logoPath} style={{ width: 48, height: 48, marginBottom: 12 }} />}
            <Text style={s.title}>ESTIMATE</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>{estimate.client.name}</Text>
            {estimate.client.company && <Text style={{ color: "#666" }}>{estimate.client.company}</Text>}
            {estimate.client.address && <Text style={{ color: "#666" }}>{estimate.client.address}</Text>}
            {(estimate.client.city || estimate.client.state) && (
              <Text style={{ color: "#666" }}>
                {[estimate.client.city, estimate.client.state, estimate.client.zip].filter(Boolean).join(", ")}
              </Text>
            )}
            {estimate.client.email && <Text style={{ color: "#666", marginTop: 4 }}>{estimate.client.email}</Text>}
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
      </Page>
    </Document>
  );
}
