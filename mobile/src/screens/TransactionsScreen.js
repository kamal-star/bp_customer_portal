import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api, extractError } from "../api/client";
import { colors } from "../theme";
import { productLabel } from "../constants";

export default function TransactionsScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  const load = useCallback(
    async (opts = {}) => {
      try {
        setError(null);
        const data = await api.getTransactions({ search: opts.search ?? search, page_length: 100 });
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(extractError(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search]
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      load({ search });
    }, 350);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openEfd(url) {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) Linking.openURL(url);
      else Alert.alert("Receipt", "Could not open the receipt link.");
    } catch (_) {
      Alert.alert("Receipt", "Could not open the receipt link.");
    }
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.orderName}>{item.name}</Text>
          <Text style={styles.date}>{item.date || "—"}</Text>
        </View>

        <Text style={styles.product}>{productLabel(item.item)}</Text>

        <View style={styles.qtyRow}>
          <View>
            <Text style={styles.metaLabel}>Ordered</Text>
            <Text style={styles.metaValue}>{Number(item.qty || 0)} L</Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Actual (invoiced)</Text>
            <Text style={[styles.metaValue, { color: colors.primaryLight }]}>
              {item.invoice_qty ? `${item.invoice_qty} L` : "—"}
            </Text>
          </View>
          <View>
            <Text style={styles.metaLabel}>Invoice</Text>
            <Text style={styles.metaValue}>{item.sales_invoice || "—"}</Text>
          </View>
        </View>

        {item.efd ? (
          <TouchableOpacity style={styles.efdBtn} onPress={() => openEfd(item.efd)}>
            <Text style={styles.efdText}>🧾 View EFD receipt ↗</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.noEfd}>No EFD receipt yet</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search order, invoice or vehicle"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(o) => o.name}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 12 }}
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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {error ? error : "No invoiced transactions yet."}
              </Text>
            </View>
          }
        />
      )}
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderName: { fontSize: 16, fontWeight: "700", color: colors.text },
  date: { fontSize: 13, color: colors.muted },
  product: { fontSize: 14, fontWeight: "600", color: colors.primaryLight, marginTop: 4 },
  qtyRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  metaLabel: { fontSize: 11, color: colors.muted },
  metaValue: { fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 2 },
  efdBtn: {
    marginTop: 14,
    backgroundColor: "#EAF3FF",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  efdText: { color: colors.received, fontWeight: "700", fontSize: 14 },
  noEfd: { marginTop: 14, color: colors.muted, fontSize: 13, fontStyle: "italic" },
  empty: { alignItems: "center", marginTop: 60, paddingHorizontal: 24 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: "center" },
});
