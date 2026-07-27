# BP Great North — Customer Fuel Order App

An Android app (React Native / Expo) that mirrors the existing
[`/fuel_orders`](https://bpgreatnorth.com/fuel_orders) web portal. Customers sign in
and manage their **fuel orders** (the ERPNext **`SO Request`** doctype, naming
series `FT…`) — view, search, filter, create, edit, and cancel — all scoped to their
own customer via the Customer `portal_users` table.

This repository is **both** the Frappe app (at the root, installable with
`bench get-app`) and the mobile client (in `mobile/`).

```
bp_customer_portal/        # Frappe app: token login + JSON list, delegates create/edit/cancel to greatnorth
├── api.py                 # app_login, get_fuel_orders, get/create/update/cancel
├── hooks.py
├── modules.txt
└── patches.txt
pyproject.toml             # makes the repo root a valid, installable Frappe app
INSTALL.md                 # backend install steps (bench get-app)
mobile/                    # React Native (Expo) app
├── App.js
└── src/
    ├── constants.js       # fuel products, stations, statuses
    ├── api/client.js
    ├── context/AuthContext.js
    ├── components/FuelOrderForm.js
    └── screens/           # Login, Orders, OrderDetail, CreateOrder, EditOrder
```

## Why this shape

The `/fuel_orders` portal already runs on a custom `greatnorth` app that exposes
`create_fuel_order`, `get_fuel_order`, `update_fuel_order`, and `delete_fuel_order`
(the "Cancel Order" action) — all customer-scoped. The web page renders the **list**
as server-side HTML, so the only genuinely new server pieces the app needs are a
**token login** and a **JSON list** endpoint. The `bp_customer_portal` app adds those
and delegates create/edit/cancel back to `greatnorth`, so app behaviour stays
identical to the website.

## Fields (SO Request)

| Field | In app |
|---|---|
| `item` | Fuel product — Diesel `D001` / Petrol `P002` |
| `qty` | Quantity (Litres) |
| `date` | Delivery date (form sends `delivery_date`) |
| `station` | Station (Warehouse, e.g. `SAKINA STATION - GNSS`) |
| `vehicle` | Vehicle registration |
| `driver_name`, `driver_mobile_number` | Driver details |
| `customer_po_no`, `customer_po_date` | Customer PO |
| `remarks` | Additional instructions |
| `otp` | Collection OTP (read-only, shown on card + detail) |
| `status` | Received / Served / Cancelled |

## How auth & scoping work

1. **Login** posts email + password to `bp_customer_portal.api.app_login`. The server
   verifies the credentials, finds the Customer whose `portal_users` contains that
   user, and returns an **API key + secret**. Stored in the device secure store; the
   password is never persisted.
2. **Every other call** sends `Authorization: token <key>:<secret>`. Each endpoint
   re-derives the customer from `portal_users` on the server, and writes additionally
   check the order's `customer` — the phone can only ever see or touch its own orders.

## Setup order

1. **Backend first** — [`erpnext-app/INSTALL.md`](erpnext-app/INSTALL.md): install
   the app on the bench serving `bpgreatnorth.com` (needs the `greatnorth` app, which
   is already there).
2. **Then the app** — [`mobile/README.md`](mobile/README.md): run in Expo Go or build
   an APK.

## Security notes

- All authorization is server-side; the app holds only a per-user token.
- HTTPS only (`https://bpgreatnorth.com`).
- Fuel products are fixed (Diesel/Petrol). Stations are fetched live from Warehouses
  ending in `- GNSS`, with a bundled fallback list.
- "Cancel order" sets the order to **Cancelled** (it still appears in the list, as on
  the web) — it is not a hard delete.
