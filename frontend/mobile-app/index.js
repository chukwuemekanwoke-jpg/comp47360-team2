// Resolves the dev API origin, then hands off to expo-router.
//
// Everything here is dev-only. Release builds fall through to
// EXPO_PUBLIC_API_URL from eas.json, untouched.
function resolveDevApiOrigin() {
  if (!__DEV__) return null;

  // Expo web — the browser already knows which origin served the app.
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }

  // Native — the dev bundle's own URL is the bundler origin.
  try {
    const { NativeModules } = require('react-native');
    const scriptURL = NativeModules && NativeModules.SourceCode && NativeModules.SourceCode.scriptURL;
    // A release bundle is a file:// URL, which correctly matches nothing here.
    const origin = typeof scriptURL === 'string' && scriptURL.match(/^https?:\/\/[^/]+/);
    if (origin) return origin[0];
  } catch {
    // Not a React Native runtime; leave it unresolved.
  }

  return null;
}

globalThis.__TABLE_DEV_API_ORIGIN__ = resolveDevApiOrigin();

require('expo-router/entry');
