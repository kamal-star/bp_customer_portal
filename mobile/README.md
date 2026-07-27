# BP Great North Orders — mobile app

React Native (Expo) app. Talks to the `bp_customer_portal` Frappe endpoints on
your ERPNext server.

## Prerequisites

- Node.js 20 or newer (required by Expo SDK 54)
- The **Expo Go** app on your Android phone (from the Play Store) for quick testing,
  OR Android Studio if you want a standalone APK
- The backend already installed (see `../erpnext-app/INSTALL.md`)

## Run it (fastest path — Expo Go)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your Android phone (phone and computer on
the same network). The app loads; sign in with a customer's ERPNext email + password.

> The server URL defaults to `https://bpgreatnorth.com` (set in `app.json` →
> `expo.extra.defaultServerUrl`). You can override it per-login by tapping
> **Server settings** on the login screen.

## Build a standalone Android APK

Uses EAS Build (Expo's cloud builder — free tier is fine):

```bash
npm install -g eas-cli
eas login
cd mobile
eas build -p android --profile preview
```

EAS returns a download link for the `.apk`. Install it on any Android device, or
distribute it to customers. For Play Store, use `--profile production` and an `.aab`.

To build locally instead (needs Android Studio + SDK):

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## Configuration

- **Default server:** `app.json` → `expo.extra.defaultServerUrl`
- **App name / package id:** `app.json` → `expo.name`, `expo.android.package`
- **Brand colors:** `src/theme.js`

## Project map

| File | Purpose |
|------|---------|
| `App.js` | Navigation + auth gate |
| `src/constants.js` | Fuel products, stations, statuses (fallbacks) |
| `src/context/AuthContext.js` | Login, token storage (expo-secure-store), session restore |
| `src/api/client.js` | axios wrapper + Frappe response/error unwrapping |
| `src/screens/LoginScreen.js` | Email + password sign in |
| `src/screens/OrdersScreen.js` | List, search (order/vehicle/driver/PO), status filter, pull-to-refresh, create FAB |
| `src/screens/OrderDetailScreen.js` | Fuel order fields + OTP; edit / cancel actions |
| `src/screens/CreateOrderScreen.js` | New fuel order |
| `src/screens/EditOrderScreen.js` | Edit a fuel order |
| `src/components/FuelOrderForm.js` | Shared form: product + station dropdowns, driver/vehicle, dates, remarks |
```
