import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    paddingBottom: 10,
    marginBottom: 20,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  regInfo: {
    fontSize: 8,
    textAlign: "center",
    color: "#666",
    marginTop: 4,
  },
  address: {
    fontSize: 8,
    textAlign: "center",
    color: "#666",
    marginTop: 2,
  },
});

interface HeaderProps {
  companyName: string;
  rbiRegistration?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export function DocumentHeader({ companyName, rbiRegistration, address, phone, email }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.companyName}>{companyName}</Text>
      {rbiRegistration && (
        <Text style={styles.regInfo}>RBI Registration: {rbiRegistration}</Text>
      )}
      {address && <Text style={styles.address}>{address}</Text>}
      {(phone || email) && (
        <Text style={styles.address}>
          {[phone, email].filter(Boolean).join(" | ")}
        </Text>
      )}
    </View>
  );
}
