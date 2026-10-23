import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { DocumentHeader } from "../components/header";
import { DocumentFooter } from "../components/footer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
  label: { fontSize: 9, color: "#444" },
  value: { fontSize: 9, fontWeight: "bold" },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderTopWidth: 1, borderTopColor: "#333", marginTop: 4 },
  totalLabel: { fontSize: 11, fontWeight: "bold" },
  totalValue: { fontSize: 11, fontWeight: "bold" },
  amountWords: { fontSize: 9, color: "#666", marginTop: 6, fontStyle: "italic" },
});

export interface ReceiptData {
  company: { name: string; rbiRegistration?: string; address?: string; phone?: string; email?: string };
  receiptNumber: string;
  date: string;
  borrowerName: string;
  loanAccountNumber: string;
  paymentAmount: string;
  paymentMode: string;
  referenceNumber?: string;
  allocatedToPrincipal: string;
  allocatedToInterest: string;
  allocatedToPenalty: string;
  outstandingAfter: string;
  amountInWords: string;
}

export function PaymentReceipt({ data }: { data: ReceiptData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocumentHeader
          companyName={data.company.name}
          rbiRegistration={data.company.rbiRegistration}
          address={data.company.address}
        />

        <Text style={styles.title}>Payment Receipt</Text>

        <View style={styles.section}>
          <Row label="Receipt Number" value={data.receiptNumber} />
          <Row label="Date" value={data.date} />
          <Row label="Borrower" value={data.borrowerName} />
          <Row label="Loan Account" value={data.loanAccountNumber} />
          <Row label="Payment Mode" value={data.paymentMode} />
          {data.referenceNumber && <Row label="Reference" value={data.referenceNumber} />}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allocation</Text>
          <Row label="Towards Interest" value={data.allocatedToInterest} />
          <Row label="Towards Penalty" value={data.allocatedToPenalty} />
          <Row label="Towards Principal" value={data.allocatedToPrincipal} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.totalValue}>{data.paymentAmount}</Text>
          </View>
          <Text style={styles.amountWords}>{data.amountInWords}</Text>
        </View>

        <View style={styles.section}>
          <Row label="Outstanding Balance After Payment" value={data.outstandingAfter} />
        </View>

        <Text style={{ fontSize: 8, color: "#999", marginTop: 30 }}>
          This is a system-generated receipt. No signature required.
        </Text>

        <DocumentFooter />
      </Page>
    </Document>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
