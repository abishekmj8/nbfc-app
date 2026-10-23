import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  text: {
    fontSize: 7,
    color: "#999",
  },
});

interface FooterProps {
  pageNumber?: number;
  disclaimer?: string;
}

export function DocumentFooter({ disclaimer }: FooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.text}>
        {disclaimer ?? "This is a system-generated document."}
      </Text>
      <Text style={styles.text} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}
