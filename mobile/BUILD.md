# Building the shareable Android APK

The app is branded as **Great North Fuel** (client logo + brand green). This builds
a standalone `.apk` you can send straight to the client — they just tap to install
(no Play Store, no Expo Go needed).

## Recommended: EAS Build (cloud — no Android SDK needed)

Everything compiles on Expo's servers. You only need Node + a free Expo account.

```bash
cd D:\claude\bp-order-app\mobile

# 1. Install the EAS CLI (once)
npm install -g eas-cli

# 2. Sign in (create a free account at https://expo.dev if you don't have one)
eas login

# 3. Build the APK
eas build -p android --profile preview
```

On the first build EAS will:
- offer to **create the project** → say **yes**
- offer to **generate an Android Keystore** → say **yes** (it manages signing for you)

The build takes ~10–20 min. When it finishes, the terminal (and your
[expo.dev](https://expo.dev) dashboard) shows a **download link** to the `.apk`.
Download it and share that file with the client.

> Rename the downloaded file to something friendly like `GreatNorthFuel-v1.apk`
> before sharing — the filename doesn't affect the installed app name (which is
> **Great North Fuel** from the launcher icon).

### Installing on a client's phone
Send them the `.apk`. On their phone they open it and, when prompted, allow
"Install unknown apps" for whatever app opened it (Files / Chrome / WhatsApp). Then
Install. The **gn** icon on brand green appears in their app drawer.

## Alternative: local build (needs Android Studio + JDK 17)

Only if you'd rather not use EAS:

```bash
cd D:\claude\bp-order-app\mobile
npx expo prebuild -p android --clean
cd android
gradlew assembleRelease      # Windows (use ./gradlew on macOS/Linux)
```

APK appears at `android/app/build/outputs/apk/release/app-release.apk`.
(Release builds need a signing keystore configured; EAS is easier because it handles
this for you.)

## Updating the app later

Bump `version` and `android.versionCode` in `app.json`, then run the EAS build
command again and share the new APK.

## Branding reference (already set)

| Item | Value | Where |
|---|---|---|
| App name (launcher) | **Great North Fuel** | `app.json` → `expo.name` |
| Package id | `com.bpgreatnorth.orders` | `app.json` → `android.package` |
| Launcher icon | `assets/icon.png` (gn on green) | `app.json` → `expo.icon` |
| Android adaptive icon | `assets/adaptive-icon.png` + green | `app.json` → `android.adaptiveIcon` |
| Splash | `assets/splash.png` on green | `app.json` → `expo.splash` |

To change the display name, edit `expo.name` (e.g. to `GN Fuel`) and rebuild.
