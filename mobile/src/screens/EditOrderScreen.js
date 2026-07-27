import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import FuelOrderForm from "../components/FuelOrderForm";
import { api, extractError } from "../api/client";
import { colors } from "../theme";

export default function EditOrderScreen({ route, navigation }) {
  const { name } = route.params;
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const order = await api.getOrder(name);
        if (!order.editable) {
          setError("This order can no longer be edited.");
          return;
        }
        setInitial(order);
      } catch (e) {
        setError(extractError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [name]);

  async function onSubmit(payload) {
    await api.updateOrder({ name, ...payload });
    Alert.alert("Saved", `Fuel order ${name} was updated.`, [
      { text: "OK", onPress: () => navigation.replace("OrderDetail", { name }) },
    ]);
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 60 }} size="large" color={colors.primary} />;
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return <FuelOrderForm initial={initial} submitLabel="Save changes" onSubmit={onSubmit} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { color: colors.danger, fontSize: 15, textAlign: "center" },
});
