# Driver Mobile App

Expo Router scaffold for the driver workflow. The login is intentionally mock-only for Sprint 2: it stores the entered driver UUID in navigation params. Replace it with proper driver authentication before production.

## Initialize

From the repository root:

```powershell
npx create-expo-app@latest mobile-app --template blank-typescript
cd mobile-app
npx expo install expo-router expo-linking expo-constants react-native-safe-area-context react-native-screens
npx expo install expo-image-picker
```

Copy the `mobile/app`, `mobile/services`, and `mobile/types` folders from this repository into the generated app, then enable Expo Router in the generated `package.json` and `app.json` if the template has not already done so.

## Local API configuration

Create `mobile-app/.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
EXPO_PUBLIC_API_KEY=local-development-key-change-me
```

Use the host machine's LAN IP for a physical device. Android emulator usually reaches the host at `http://10.0.2.2:3000`; iOS simulator can use `http://127.0.0.1:3000`. The API must be reachable on the local network and the device must be on the same network.

Run:

```powershell
npx expo start
```

The API key is suitable only for local development. Production must use authenticated driver sessions and must not embed a shared server secret in the app.
