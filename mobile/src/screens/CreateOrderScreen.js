import React from "react";
import { Alert } from "react-native";
import FuelOrderForm from "../components/FuelOrderForm";
import { api } from "../api/client";

export default function CreateOrderScreen({ navigation }) {
  async function onSubmit(payload) {
    const res = await api.createOrder(payload);
    const name = res && (res.name || res);
    Alert.alert("Order created", name ? `Fuel order ${name} was created.` : "Fuel order created.", [
      {
        text: "OK",
        onPress: () =>
          name ? navigation.replace("OrderDetail", { name }) : navigation.goBack(),
      },
    ]);
  }

  return <FuelOrderForm initial={null} submitLabel="Submit fuel order" onSubmit={onSubmit} />;
}
