import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api, extractError } from "../api/client";
import { colors } from "../theme";
import { FUEL_PRODUCTS, STATIONS } from "../constants";

function toISO(d) {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  const m = `${dt.getMonth() + 1}`.padStart(2, "0");
  const day = `${dt.getDate()}`.padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${day}`;
}

/**
 * Shared create/edit form for a fuel order (SO Request).
 *
 * props:
 *   initial     { item, qty, date, vehicle, driver_name, driver_mobile_number,
 *                 customer_po_no, customer_po_date, station, remarks } | null
 *   submitLabel string
 *   onSubmit    async (payload) => void
 */
export default function FuelOrderForm({ initial, submitLabel, onSubmit }) {
  const [products, setProducts] = useState(FUEL_PRODUCTS);
  const [stations, setStations] = useState(STATIONS);

  const [item, setItem] = useState(initial?.item || "");
  const [qty, setQty] = useState(initial?.qty != null ? String(initial.qty) : "");
  const [deliveryDate, setDeliveryDate] = useState(
    initial?.date ? new Date(initial.date) : new Date()
  );
  const [vehicle, setVehicle] = useState(initial?.vehicle || "");
  const [driverName, setDriverName] = useState(initial?.driver_name || "");
  const [driverMobile, setDriverMobile] = useState(initial?.driver_mobile_number || "");
  const [poNo, setPoNo] = useState(initial?.customer_po_no || "");
  const [poDate, setPoDate] = useState(
    initial?.customer_po_date ? new Date(initial.customer_po_date) : null
  );
  const [station, setStation] = useState(initial?.station || "");
  const [remarks, setRemarks] = useState(initial?.remarks || "");

  const [showDeliveryDate, setShowDeliveryDate] = useState(false);
  const [showPoDate, setShowPoDate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Prefer live options from the server; fall back to bundled constants.
  useEffect(() => {
    api
      .getFormOptions()
      .then((opts) => {
        if (opts?.products?.length) setProducts(opts.products);
        if (opts?.stations?.length) setStations(opts.stations);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!item) return Alert.alert("Fuel product", "Please select a fuel product.");
    const q = parseFloat(qty);
    if (!q || q <= 0) return Alert.alert("Quantity", "Enter a quantity greater than zero.");
    if (!vehicle.trim()) return Alert.alert("Vehicle", "Enter the vehicle registration.");
    if (!driverName.trim()) return Alert.alert("Driver", "Enter the driver name.");
    if (!driverMobile.trim()) return Alert.alert("Driver", "Enter the driver mobile number.");
    if (!station) return Alert.alert("Station", "Please select a station.");

    setSaving(true);
    try {
      await onSubmit({
        item,
        qty: q,
        delivery_date: toISO(deliveryDate),
        vehicle: vehicle.trim(),
        driver_name: driverName.trim(),
        driver_mobile_number: driverMobile.trim(),
        customer_po_no: poNo.trim(),
        customer_po_date: toISO(poDate),
        station,
        remarks: remarks.trim(),
      });
    } catch (e) {
      Alert.alert("Error", extractError(e));
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <SectionTitle>Product information</SectionTitle>

        <Field label="Fuel product *">
          <Dropdown
            placeholder="Select fuel product"
            value={item}
            display={products.find((p) => p.value === item)?.label}
            options={products.map((p) => ({ value: p.value, label: `${p.label} (${p.value})` }))}
            onSelect={setItem}
          />
        </Field>

        <Field label="Quantity (Litres) *">
          <TextInput
            style={styles.input}
            value={qty}
            onChangeText={setQty}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Delivery date *">
          <TouchableOpacity style={styles.input} onPress={() => setShowDeliveryDate(true)}>
            <Text style={styles.inputText}>{toISO(deliveryDate)}</Text>
          </TouchableOpacity>
        </Field>

        <SectionTitle>Delivery details</SectionTitle>

        <Field label="Vehicle *">
          <TextInput
            style={styles.input}
            value={vehicle}
            onChangeText={setVehicle}
            autoCapitalize="characters"
            placeholder="T123ABC"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Driver name *">
          <TextInput
            style={styles.input}
            value={driverName}
            onChangeText={setDriverName}
            placeholder="Driver full name"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="Driver mobile *">
          <TextInput
            style={styles.input}
            value={driverMobile}
            onChangeText={setDriverMobile}
            keyboardType="phone-pad"
            placeholder="0785123456"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <SectionTitle>Customer information</SectionTitle>

        <Field label="Station *">
          <Dropdown
            placeholder="Select station"
            value={station}
            display={station}
            options={stations.map((s) => ({ value: s, label: s }))}
            onSelect={setStation}
          />
        </Field>

        <Field label="PO number">
          <TextInput
            style={styles.input}
            value={poNo}
            onChangeText={setPoNo}
            placeholder="Purchase order reference"
            placeholderTextColor={colors.muted}
          />
        </Field>

        <Field label="PO date">
          <TouchableOpacity style={styles.input} onPress={() => setShowPoDate(true)}>
            <Text style={[styles.inputText, !poDate && { color: colors.muted }]}>
              {poDate ? toISO(poDate) : "Select date"}
            </Text>
          </TouchableOpacity>
        </Field>

        <SectionTitle>Remarks</SectionTitle>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Additional instructions..."
          placeholderTextColor={colors.muted}
          multiline
        />

        {showDeliveryDate && (
          <DateTimePicker
            value={deliveryDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, d) => {
              setShowDeliveryDate(Platform.OS === "ios");
              if (e.type !== "dismissed" && d) setDeliveryDate(d);
            }}
          />
        )}
        {showPoDate && (
          <DateTimePicker
            value={poDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(e, d) => {
              setShowPoDate(Platform.OS === "ios");
              if (e.type !== "dismissed" && d) setPoDate(d);
            }}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submit, saving && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{submitLabel}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Field({ label, children }) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

// Lightweight dropdown (Modal list) — avoids an extra native picker dependency.
function Dropdown({ placeholder, value, display, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.input} onPress={() => setOpen(true)}>
        <Text style={[styles.inputText, !value && { color: colors.muted }]}>
          {display || placeholder}
        </Text>
        <Text style={styles.caret}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item: o }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    onSelect(o.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, value === o.value && styles.optionActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 22,
    marginBottom: 2,
  },
  label: { fontSize: 13, color: colors.muted, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  inputText: { fontSize: 16, color: colors.text },
  caret: { color: colors.muted, fontSize: 14 },
  textarea: { minHeight: 90, textAlignVertical: "top", display: "flex" },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  submit: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
    maxHeight: "60%",
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  optionRow: { paddingVertical: 14, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: colors.border },
  optionText: { fontSize: 16, color: colors.text },
  optionActive: { color: colors.primary, fontWeight: "700" },
});
