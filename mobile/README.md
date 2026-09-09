# Driver Mobile App

Expo Router scaffold for the driver workflow. The login accepts a driver UUID for the current mock-login flow, exchanges it for a short-lived JWT, and uses that bearer token for driver API calls.

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
```

Use the host machine's LAN IP for a physical device. Android emulator usually reaches the host at `http://10.0.2.2:3000`; iOS simulator can use `http://127.0.0.1:3000`. The API must be reachable on the local network and the device must be on the same network.

Run:

```powershell
npx expo start
```

The mobile app does not contain the server's webhook API key. Production should replace the mock driver-ID login with a real credential flow and secure token storage/refresh.
