import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { DocumentHeader } from "../components/header";
import { DocumentFooter } from "../components/footer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 25 },
  body: { fontSize: 10, lineHeight: 1.6, marginBottom: 15 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  label: { fontSize: 9, color: "#444" },
  value: { fontSize: 9, fontWeight: "bold" },
  signature: { marginTop: 50 },
  signLine: { borderTopWidth: 1, borderTopColor: "#333", width: 200, marginTop: 40 },
  signText: { fontSize: 8, color: "#666", marginTop: 4 },
});

export interface NocData {
  company: { name: string; rbiRegistration?: string; address?: string; phone?: string };
  borrowerName: string;
  loanAccountNumber: string;
  principalAmount: string;
  disbursementDate: string;
  closureDate: string;
  closureType: string;
  date: string;
}

export function NocCertificate({ data }: { data: NocData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocumentHeader
          companyName={data.company.name}
          rbiRegistration={data.company.rbiRegistration}
          address={data.company.address}
          phone={data.company.phone}
        />

        <Text style={styles.title}>No Objection Certificate</Text>

        <Text style={styles.body}>
          This is to certify that the loan account detailed below has been closed and
          all dues have been settled in full. {data.company.name} has no objection
          or claim against the borrower in respect of this loan facility.
        </Text>

        <View style={{ marginBottom: 20 }}>
          <Row label="Borrower Name" value={data.borrowerName} />
          <Row label="Loan Account Number" value={data.loanAccountNumber} />
          <Row label="Loan Amount" value={data.principalAmount} />
          <Row label="Date of Disbursement" value={data.disbursementDate} />
          <Row label="Date of Closure" value={data.closureDate} />
          <Row label="Closure Type" value={data.closureType} />
        </View>

        <Text style={styles.body}>
          This certificate is issued upon the request of the borrower and is valid
          for all purposes. All security interests, if any, created in favour of
          {" "}{data.company.name} stand released.
        </Text>

        <View style={styles.signature}>
          <Text style={{ fontSize: 9 }}>For {data.company.name}</Text>
          <View style={styles.signLine} />
          <Text style={styles.signText}>Authorized Signatory</Text>
          <Text style={{ fontSize: 8, color: "#666", marginTop: 8 }}>Date: {data.date}</Text>
        </View>

        <DocumentFooter disclaimer="No Objection Certificate — system generated" />
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
