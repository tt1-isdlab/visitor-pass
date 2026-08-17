import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { VISITOR_TYPE_LABELS } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    width: 298, // ~A6 width in points (105mm)
    height: 420, // ~A6 height (148mm)
    backgroundColor: "#05070d",
    padding: 0,
    fontFamily: "Helvetica",
  },
  header: {
    backgroundColor: "#0e7490",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  brand: {
    color: "#ecfeff",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: 1,
  },
  passLabel: {
    color: "#a5f3fc",
    fontSize: 9,
    marginTop: 2,
    letterSpacing: 2,
  },
  body: {
    padding: 18,
    flexGrow: 1,
  },
  name: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 2,
  },
  sub: {
    color: "#67e8f9",
    fontSize: 10,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#1e293b",
    paddingBottom: 6,
  },
  label: { color: "#64748b", fontSize: 8, textTransform: "uppercase" },
  value: { color: "#e2e8f0", fontSize: 10, fontWeight: 700, marginTop: 2 },
  qrWrap: {
    alignItems: "center",
    marginTop: 14,
  },
  qr: { width: 110, height: 110 },
  footer: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#0b0f1a",
    textAlign: "center",
  },
  footerText: { color: "#475569", fontSize: 7 },
  regId: {
    color: "#22d3ee",
    fontSize: 11,
    fontWeight: 700,
    marginTop: 6,
    textAlign: "center",
  },
});

export function VisitorPassDocument({
  fullName,
  collegeName,
  visitorType,
  registrationId,
  eventDate,
  qrDataUrl,
}: {
  fullName: string;
  collegeName: string;
  visitorType: string;
  registrationId: string;
  eventDate: string;
  qrDataUrl: string;
}) {
  return (
    <Document>
      <Page size={[298, 420]} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>ROBOFEST 2.0</Text>
          <Text style={styles.passLabel}>VISITOR PASS</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.sub}>{VISITOR_TYPE_LABELS[visitorType] ?? visitorType}</Text>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>College / Organization</Text>
              <Text style={styles.value}>{collegeName}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Validity / Event Date</Text>
              <Text style={styles.value}>{eventDate}</Text>
            </View>
          </View>

          <View style={styles.qrWrap}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrDataUrl} style={styles.qr} />
            <Text style={styles.regId}>{registrationId}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Present this pass with a valid photo ID at the venue entrance. Non-transferable.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
