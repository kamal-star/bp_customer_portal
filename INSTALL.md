# Installing the `bp_customer_portal` mobile API app

This is a small Frappe app that gives the Android app a clean, token-authenticated,
customer-scoped JSON API. It **reuses your existing `greatnorth` fuel logic** — it
does not reimplement order creation.

It talks to the **`SO Request`** doctype (naming series `FT…`) and scopes every
order to the Customer linked to the logged-in user through the Customer
`portal_users` table — exactly like the existing `/fuel_orders` web portal.

## What it adds vs. reuses

| Action | Endpoint the app calls | Implementation |
|--------|------------------------|----------------|
| Login (get token) | `bp_customer_portal.api.app_login` | **new** |
| List orders | `bp_customer_portal.api.get_fuel_orders` | **new** (portal renders HTML, no JSON list existed) |
| Form options | `bp_customer_portal.api.get_form_options` | **new** |
| View one order | `bp_customer_portal.api.get_fuel_order` | **new** (adds status/OTP the portal read omitted) |
| Create | `bp_customer_portal.api.create_fuel_order` | delegates to `greatnorth.api.fuel.create_fuel_order` |
| Edit | `bp_customer_portal.api.update_fuel_order` | delegates to `greatnorth.api.fuel.update_fuel_order` |
| Cancel | `bp_customer_portal.api.cancel_fuel_order` | delegates to `greatnorth.api.fuel.delete_fuel_order` |

## 1. Get the app onto your bench

This repo **is** the Frappe app, so install it straight from GitHub:

```bash
cd /path/to/frappe-bench
bench get-app https://github.com/kamal-star/bp_customer_portal.git
```

(To update later: `bench get-app --branch main ...` or `cd apps/bp_customer_portal && git pull`.)

## 2. Install on your site

```bash
bench --site bpgreatnorth.com install-app bp_customer_portal
bench --site bpgreatnorth.com clear-cache
bench restart
```

> The `mobile/` folder in this repo is the React Native app — it is ignored by
> Frappe and does not affect the backend install.

> The app imports `greatnorth.api.fuel`, so `greatnorth` must already be installed
> on the same site (it is — it powers /fuel_orders).

## 3. Portal users

No new setup: any customer that can already use the `/fuel_orders` web portal
(i.e. is listed in that Customer's **Portal Users**) can sign in to the app with the
same email + password.

## 4. Smoke test

```bash
# Login -> api_key / api_secret / customer
curl -X POST https://bpgreatnorth.com/api/method/bp_customer_portal.api.app_login \
  -d 'usr=CUSTOMER_EMAIL&pwd=THEIR_PASSWORD'

# List that customer's fuel orders
curl 'https://bpgreatnorth.com/api/method/bp_customer_portal.api.get_fuel_orders' \
  -H 'Authorization: token API_KEY:API_SECRET'
```

You should get back only that customer's `FT…` orders.

## Notes

- **Auth:** `app_login` verifies email + password and returns a per-user API
  key/secret. The app stores those and sends `Authorization: token key:secret` on
  every later call. The password is never stored on the device.
- **Scope:** every read and write re-derives the customer from `portal_users` on the
  server, and writes additionally verify the order's `customer` matches — the phone
  can never touch another customer's order.
- **Cancel** calls the same `delete_fuel_order` the web portal's "Cancel Order"
  button uses (it sets the order to *Cancelled*; cancelled orders still appear in the
  list, as they do on the web).
- **Fuel products** (Diesel `D001`, Petrol `P002`) are fixed to match the portal.
  **Stations** are pulled from Warehouses ending in `- GNSS`; adjust the filter in
  `get_form_options` if your station naming differs.
- **`delivery_date`** (what the form/app sends) is stored on the `date` field by
  greatnorth; reads return `date`. The app handles this mapping.
