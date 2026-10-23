import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { DocumentHeader } from "../components/header";
import { DocumentFooter } from "../components/footer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica" },
  title: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 5 },
  subtitle: { fontSize: 9, textAlign: "center", color: "#666", marginBottom: 15 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#333", paddingBottom: 4, marginBottom: 2 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  col: { textAlign: "right", paddingHorizontal: 2 },
  colNum: { width: 25 },
  colDate: { width: 65, textAlign: "left" },
  colAmt: { width: 70 },
  headerText: { fontSize: 8, fontWeight: "bold", color: "#444" },
  cellText: { fontSize: 8 },
  summary: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#333", paddingTop: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  summaryLabel: { fontSize: 9, color: "#444" },
  summaryValue: { fontSize: 9, fontWeight: "bold" },
});

export interface EmiScheduleData {
  company: { name: string; rbiRegistration?: string; address?: string };
  loanAccountNumber: string;
  borrowerName: string;
  principalAmount: string;
  interestRate: string;
  tenure: string;
  monthlyEmi: string;
  totalInterest: string;
  totalRepayment: string;
  rows: Array<{
    number: number;
    dueDate: string;
    emi: string;
    principal: string;
    interest: string;
    balance: string;
  }>;
}

export function EmiScheduleDocument({ data }: { data: EmiScheduleData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DocumentHeader companyName={data.company.name} rbiRegistration={data.company.rbiRegistration} address={data.company.address} />

        <Text style={styles.title}>EMI Schedule</Text>
        <Text style={styles.subtitle}>
          {data.loanAccountNumber} — {data.borrowerName}
        </Text>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.headerText, styles.colNum]}>#</Text>
          <Text style={[styles.headerText, styles.colDate]}>Due Date</Text>
          <Text style={[styles.headerText, styles.col, styles.colAmt]}>EMI</Text>
          <Text style={[styles.headerText, styles.col, styles.colAmt]}>Principal</Text>
          <Text style={[styles.headerText, styles.col, styles.colAmt]}>Interest</Text>
          <Text style={[styles.headerText, styles.col, styles.colAmt]}>Balance</Text>
        </View>

        {/* Table Rows */}
        {data.rows.map((row) => (
          <View key={row.number} style={styles.tableRow}>
            <Text style={[styles.cellText, styles.colNum]}>{row.number}</Text>
            <Text style={[styles.cellText, styles.colDate]}>{row.dueDate}</Text>
            <Text style={[styles.cellText, styles.col, styles.colAmt]}>{row.emi}</Text>
            <Text style={[styles.cellText, styles.col, styles.colAmt]}>{row.principal}</Text>
            <Text style={[styles.cellText, styles.col, styles.colAmt]}>{row.interest}</Text>
            <Text style={[styles.cellText, styles.col, styles.colAmt]}>{row.balance}</Text>
          </View>
        ))}

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Principal Amount</Text>
            <Text style={styles.summaryValue}>{data.principalAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Interest</Text>
            <Text style={styles.summaryValue}>{data.totalInterest}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Repayment</Text>
            <Text style={styles.summaryValue}>{data.totalRepayment}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monthly EMI</Text>
            <Text style={styles.summaryValue}>{data.monthlyEmi}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Interest Rate</Text>
            <Text style={styles.summaryValue}>{data.interestRate}</Text>
          </View>
        </View>

        <DocumentFooter />
      </Page>
    </Document>
  );
}
