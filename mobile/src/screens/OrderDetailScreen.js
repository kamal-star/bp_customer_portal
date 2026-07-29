import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, extractError } from "../api/client";
import { colors, statusColor } from "../theme";
import { productLabel } from "../constants";

export default function OrderDetailScreen({ route, navigation }) {
  const { name } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setOrder(await api.getOrder(name));
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  }, [name]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function doCancel() {
    setShowCancel(false);
    setActing(true);
    try {
      await api.cancelOrder(order.name);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", extractError(e));
      setActing(false);
    }
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color={colors.primary} />;
  }
  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Order not found."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={styles.headerRow}>
        <Text style={styles.orderName}>{order.name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColor(order.status) }]}>
          <Text style={styles.badgeText}>{order.status}</Text>
        </View>
      </View>

      {order.otp ? (
        <View style={styles.otpCard}>
          <Text style={styles.otpLabel}>Collection OTP</Text>
          <Text style={styles.otpValue}>{order.otp}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Product</Text>
      <View style={styles.card}>
        <Row label="Fuel product" value={productLabel(order.item)} />
        <Row label="Quantity" value={`${Number(order.qty || 0)} Litres`} bold />
        <Row label="Delivery date" value={order.date || "—"} />
        <Row label="Station" value={order.station || "—"} />
      </View>

      <Text style={styles.sectionTitle}>Delivery details</Text>
      <View style={styles.card}>
        <Row label="Vehicle" value={order.vehicle || "—"} />
        <Row label="Driver name" value={order.driver_name || "—"} />
        <Row label="Driver mobile" value={order.driver_mobile_number || "—"} />
      </View>

      <Text style={styles.sectionTitle}>Order info</Text>
      <View style={styles.card}>
        <Row label="PO number" value={order.customer_po_no || "—"} />
        <Row label="PO date" value={order.customer_po_date || "—"} />
        {order.remarks ? <Row label="Remarks" value={order.remarks} /> : null}
        {order.sales_order ? <Row label="Sales order" value={order.sales_order} /> : null}
        {order.sales_invoice ? <Row label="Invoice" value={order.sales_invoice} /> : null}
      </View>

      {acting ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
      ) : (
        <View style={styles.actions}>
          {order.editable && (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => navigation.navigate("EditOrder", { name: order.name })}
            >
              <Text style={styles.btnPrimaryText}>Edit order</Text>
            </TouchableOpacity>
          )}
          {order.cancellable && (
            <TouchableOpacity
              style={[styles.btn, styles.btnDanger]}
              onPress={() => setShowCancel(true)}
            >
              <Text style={styles.btnDangerText}>Cancel order</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={showCancel} transparent animationType="fade" onRequestClose={() => setShowCancel(false)}>
        <View style={styles.backdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.trashCircle}>
              <Text style={styles.trashIcon}>🗑️</Text>
            </View>
            <Text style={styles.confirmTitle}>Cancel Order?</Text>
            <Text style={styles.confirmBody}>
              Are you sure you want to cancel this fuel order? This action cannot be undone.
            </Text>
            <TouchableOpacity style={styles.confirmYes} onPress={doCancel}>
              <Text style={styles.confirmYesText}>Yes, Cancel Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmNo} onPress={() => setShowCancel(false)}>
              <Text style={styles.confirmNoText}>No, Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: "800", fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: colors.danger, fontSize: 15, textAlign: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  orderName: { fontSize: 20, fontWeight: "800", color: colors.text },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  otpCard: {
    backgroundColor: "#FFF6E0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3D98C",
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  otpLabel: { fontSize: 12, fontWeight: "700", color: colors.accent, letterSpacing: 1 },
  otpValue: { fontSize: 30, fontWeight: "900", letterSpacing: 6, color: "#8A6D3B", marginTop: 2 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, gap: 12 },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 18,
    marginBottom: 8,
  },
  actions: { marginTop: 24, gap: 12 },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnDanger: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: colors.danger },
  btnDangerText: { color: colors.danger, fontSize: 16, fontWeight: "700" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    alignItems: "center",
  },
  trashCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FDEaea",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  trashIcon: { fontSize: 30 },
  confirmTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 8 },
  confirmBody: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmYes: {
    backgroundColor: colors.danger,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
  },
  confirmYesText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  confirmNo: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  confirmNoText: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
