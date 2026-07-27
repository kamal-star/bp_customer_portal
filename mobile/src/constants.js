// Fuel products and stations mirror the /fuel_orders web portal. The app fetches
// live options from the server (get_form_options) at runtime and falls back to
// these if that call fails.

export const FUEL_PRODUCTS = [
  { value: "D001", label: "Diesel" },
  { value: "P002", label: "Petrol" },
];

export const STATIONS = [
  "KARATU STATION - GNSS",
  "KISONGO-MARATHON - GNSS",
  "NGULELO STATION - GNSS",
  "NJIRO STATION - GNSS",
  "SAKINA STATION - GNSS",
  "TENGERU STATION - GNSS",
];

export const STATUSES = ["All", "Received", "Served", "Cancelled"];

export function productLabel(code) {
  const p = FUEL_PRODUCTS.find((x) => x.value === code);
  return p ? `${p.label} (${code})` : code || "—";
}
