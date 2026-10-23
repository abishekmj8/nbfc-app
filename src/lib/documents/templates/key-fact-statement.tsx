import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { DocumentHeader } from "../components/header";
import { DocumentFooter } from "../components/footer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 15 },
  subtitle: { fontSize: 8, textAlign: "center", color: "#666", marginBottom: 20 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginBottom: 6, borderBottomWidth: 1, borderBottomColor: "#eee", paddingBottom: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#f0f0f0" },
  label: { fontSize: 9, color: "#444", flex: 1 },
  value: { fontSize: 9, fontWeight: "bold", textAlign: "right", flex: 1 },
  highlight: { backgroundColor: "#f7f7f7", padding: 8, marginTop: 8, borderRadius: 3 },
  highlightText: { fontSize: 10, fontWeight: "bold", textAlign: "center" },
  notice: { fontSize: 8, color: "#666", marginTop: 15, lineHeight: 1.4 },
  bold: { fontWeight: "bold" },
});

export interface KfsData {
  company: { name: string; rbiRegistration?: string; address?: string; phone?: string; email?: string };
  applicationNumber: string;
  borrowerName: string;
  loanProduct: string;
  loanAmount: string; // formatted
  tenure: string;
  interestRate: string;
  interestType: string;
  emiAmount: string;
  totalInterest: string;
  totalRepayment: string;
  apr: string; // Annual Percentage Rate
  processingFee: string;
  stampDuty: string;
  insurancePremium?: string;
  netDisbursement: string;
  coolingOffPeriod: string;
  penalChargesRate: string;
  prepaymentConditions: string;
  grievanceOfficer: string;
  grievancePhone: string;
  date: string;
}

export function KeyFactStatement({ data }: { data: KfsData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocumentHeader
          companyName={data.company.name}
          rbiRegistration={data.company.rbiRegistration}
          address={data.company.address}
          phone={data.company.phone}
          email={data.company.email}
        />

        <Text style={styles.title}>Key Fact Statement</Text>
        <Text style={styles.subtitle}>
          As required under RBI Digital Lending Directions, 2025
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Loan Details</Text>
          <Row label="Application Number" value={data.applicationNumber} />
          <Row label="Borrower Name" value={data.borrowerName} />
          <Row label="Loan Product" value={data.loanProduct} />
          <Row label="Loan Amount" value={data.loanAmount} />
          <Row label="Tenure" value={data.tenure} />
          <Row label="Interest Rate" value={data.interestRate} />
          <Row label="Interest Type" value={data.interestType} />
          <Row label="EMI Amount" value={data.emiAmount} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost of Loan</Text>
          <Row label="Total Interest Payable" value={data.totalInterest} />
          <Row label="Processing Fee" value={data.processingFee} />
          <Row label="Stamp Duty" value={data.stampDuty} />
          {data.insurancePremium && <Row label="Insurance Premium (optional)" value={data.insurancePremium} />}
          <Row label="Net Disbursement to Borrower" value={data.netDisbursement} />
        </View>

        <View style={styles.highlight}>
          <Text style={styles.highlightText}>
            Total Amount Repayable: {data.totalRepayment}
          </Text>
          <Text style={{ fontSize: 9, textAlign: "center", marginTop: 4 }}>
            Annual Percentage Rate (APR): {data.apr}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Terms</Text>
          <Row label="Cooling-Off / Look-Up Period" value={data.coolingOffPeriod} />
          <Row label="Penal Charges" value={data.penalChargesRate} />
          <Row label="Prepayment / Foreclosure" value={data.prepaymentConditions} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grievance Redressal</Text>
          <Row label="Nodal Grievance Officer" value={data.grievanceOfficer} />
          <Row label="Contact" value={data.grievancePhone} />
        </View>

        <Text style={styles.notice}>
          This Key Fact Statement is provided in compliance with the Reserve Bank of India
          (Digital Lending) Directions, 2025. The borrower is advised to read all terms carefully
          before executing the loan agreement. The borrower has the right to exit the loan during
          the cooling-off period without penalty.
        </Text>

        <Text style={{ fontSize: 8, marginTop: 20 }}>Date: {data.date}</Text>

        <DocumentFooter disclaimer="Key Fact Statement — RBI Digital Lending Directions, 2025" />
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
