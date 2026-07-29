import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function AccountScreen() {
  const { session, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setProfile(await api.getProfile());
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

  function onLogout() {
    Alert.alert("Sign out", "Sign out of this account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  }

  const p = profile || {};
  const initials = (p.full_name || session?.fullName || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{p.full_name || session?.fullName || "—"}</Text>
            <Text style={styles.email}>{p.user || session?.user}</Text>
          </View>

          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.card}>
            <Row label="Full name" value={p.full_name} />
            <Row label="Email" value={p.user} />
            <Row label="Mobile" value={p.mobile} />
          </View>

          <Text style={styles.sectionTitle}>My customer accounts</Text>
          <View style={styles.card}>
            {(p.customers && p.customers.length ? p.customers : [
              { customer: p.customer, customer_name: p.customer_name },
            ]).map((c) => (
              <View key={c.customer} style={styles.custRow}>
                <View>
                  <Text style={styles.custName}>{c.customer_name}</Text>
                  <Text style={styles.custId}>{c.customer}</Text>
                </View>
                <View style={styles.linkedBadge}>
                  <Text style={styles.linkedText}>Linked</Text>
                </View>
              </View>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.logout} onPress={onLogout}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Great North Fuel · v1.0.0</Text>
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", marginTop: 8, marginBottom: 8 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 12 },
  email: { fontSize: 14, color: colors.muted, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    marginTop: 22,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: "600" },
  custRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  custName: { fontSize: 15, fontWeight: "700", color: colors.text },
  custId: { fontSize: 12, color: colors.muted, marginTop: 2 },
  linkedBadge: {
    backgroundColor: "#E6F4EC",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  linkedText: { color: colors.success, fontSize: 12, fontWeight: "700" },
  logout: {
    marginTop: 26,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutText: { color: colors.danger, fontSize: 16, fontWeight: "700" },
  version: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 18 },
  error: { color: colors.danger, marginTop: 16, textAlign: "center" },
});
