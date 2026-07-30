import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, extractError } from "../api/client";
import { colors, statusColor } from "../theme";
import { STATUSES, productLabel } from "../constants";

const PAGE_SIZE = 20;

export default function OrdersScreen({ navigation, route }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [error, setError] = useState(null);

  // Debounce the search box -> committed `search`.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Status filter passed in from the Dashboard cards.
  useEffect(() => {
    const incoming = route.params?.status;
    if (incoming) {
      setStatus(incoming);
      navigation.setParams({ status: undefined });
    }
  }, [route.params?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load the first page. Recreated when search/status change.
  const reload = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getOrders({ search, status, start: 0, page_length: PAGE_SIZE });
      const arr = Array.isArray(data) ? data : [];
      setOrders(arr);
      setHasMore(arr.length === PAGE_SIZE);
    } catch (e) {
      setError(extractError(e));
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, status]);

  // Reload on focus and whenever search/status change.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      reload();
    }, [reload])
  );

  async function loadMore() {
    if (loadingMore || !hasMore || loading || refreshing) return;
    setLoadingMore(true);
    try {
      const data = await api.getOrders({
        search,
        status,
        start: orders.length,
        page_length: PAGE_SIZE,
      });
      const arr = Array.isArray(data) ? data : [];
      setOrders((prev) => [...prev, ...arr]);
      setHasMore(arr.length === PAGE_SIZE);
    } catch (_) {
      // keep what we have; user can pull to refresh
    } finally {
      setLoadingMore(false);
    }
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("OrderDetail", { name: item.name })}
      >
        <View style={styles.cardTop}>
          <Text style={styles.orderName}>{item.name}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor(item.status) }]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <Text style={styles.product}>{productLabel(item.item)}</Text>
          <Text style={styles.qty}>{Number(item.qty || 0)} L</Text>
        </View>

        <View style={styles.metaGrid}>
          <Text style={styles.meta}>🚚 {item.vehicle || "—"}</Text>
          <Text style={styles.meta}>👤 {item.driver_name || "—"}</Text>
        </View>
        <View style={styles.metaGrid}>
          <Text style={styles.meta}>📅 {item.date || "—"}</Text>
          <Text style={styles.meta}>PO: {item.customer_po_no || "—"}</Text>
        </View>

        {item.otp ? (
          <View style={styles.otpRow}>
            <Text style={styles.otpLabel}>OTP</Text>
            <Text style={styles.otpValue}>{item.otp}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search order, vehicle, driver, PO or OTP"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.filterRow}>
        <FlatList
          horizontal
          data={STATUSES}
          keyExtractor={(s) => s}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item: s }) => (
            <TouchableOpacity
              style={[styles.chip, status === s && styles.chipActive]}
              onPress={() => {
                setLoading(true);
                setStatus(s);
              }}
            >
              <Text style={[styles.chipText, status === s && styles.chipTextActive]}>{s}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.name}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12, paddingBottom: 96 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                reload();
              }}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
            ) : !hasMore && orders.length > 0 ? (
              <Text style={styles.endText}>No more orders</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {error ? error : "No fuel orders found."}
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CreateOrder")}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  searchWrap: { padding: 12, paddingBottom: 6 },
  search: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  filterRow: { paddingBottom: 6 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderName: { fontSize: 16, fontWeight: "700", color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  product: { fontSize: 15, fontWeight: "600", color: colors.primaryLight },
  qty: { fontSize: 16, fontWeight: "800", color: colors.text },
  metaGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  meta: { color: colors.muted, fontSize: 13, flex: 1 },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 10,
    backgroundColor: "#FFF6E0",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  otpLabel: { fontSize: 11, fontWeight: "700", color: colors.accent, marginRight: 8 },
  otpValue: { fontSize: 15, fontWeight: "800", letterSpacing: 2, color: "#8A6D3B" },
  endText: { textAlign: "center", color: colors.muted, fontSize: 13, marginVertical: 16 },
  empty: { alignItems: "center", marginTop: 60, paddingHorizontal: 24 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: "center" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: colors.accent,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabText: { color: "#fff", fontSize: 30, fontWeight: "700", marginTop: -2 },
});
