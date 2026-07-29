import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, extractError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

const CARDS = [
  { key: "all", label: "All Orders", color: colors.primary, status: "All" },
  { key: "received", label: "Received", color: colors.received, status: "Received" },
  { key: "served", label: "Served", color: colors.success, status: "Served" },
  { key: "cancelled", label: "Cancelled", color: colors.danger, status: "Cancelled" },
];

export default function DashboardScreen({ navigation }) {
  const { session } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api.getDashboard());
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function openOrders(status) {
    navigation.navigate("OrdersTab", { screen: "Orders", params: { status } });
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          colors={[colors.primary]}
        />
      }
    >
      <Text style={styles.greeting}>Hi {session?.fullName || "there"} 👋</Text>
      <Text style={styles.company}>{session?.customerName}</Text>

      <Text style={styles.sectionTitle}>
        Order summary{data?.month ? ` · ${data.month}` : ""}
      </Text>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <View style={styles.grid}>
          {CARDS.map((c) => (
            <TouchableOpacity
              key={c.key}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => openOrders(c.status)}
            >
              <View style={[styles.dot, { backgroundColor: c.color }]} />
              <Text style={styles.count}>{data ? data[c.key] ?? 0 : 0}</Text>
              <Text style={styles.cardLabel}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.cta} onPress={() => openOrders("All")}>
        <Text style={styles.ctaText}>View all orders →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  greeting: { fontSize: 22, fontWeight: "800", color: colors.text },
  company: { fontSize: 15, color: colors.primaryLight, fontWeight: "600", marginTop: 2 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
    marginTop: 24,
    marginBottom: 12,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginBottom: 12 },
  count: { fontSize: 34, fontWeight: "900", color: colors.text },
  cardLabel: { fontSize: 14, color: colors.muted, fontWeight: "600", marginTop: 2 },
  cta: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { color: colors.danger, marginTop: 30, textAlign: "center", fontSize: 15 },
});
