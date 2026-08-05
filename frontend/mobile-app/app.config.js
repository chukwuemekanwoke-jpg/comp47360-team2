// Dynamic Expo config — loads app.json and layers build-time values on top.
//
// GOOGLE_MAPS_ANDROID_API_KEY is read from the environment when the native
// project is generated (EAS prebuild), which is the only point the key can
// enter the AndroidManifest:
//   - EAS builds: create it once as a secret —
//       npx eas-cli secret:create --scope project \
//         --name GOOGLE_MAPS_ANDROID_API_KEY --value <key>
//   - local prebuild/run (optional): put it in .env.local (gitignored).
// Without the key the config stays valid; the map view just won't render.
export default ({ config }) => {
  const android = { ...config.android };

  if (process.env.GOOGLE_MAPS_ANDROID_API_KEY) {
    android.config = {
      ...android.config,
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY },
    };
  }

  return { ...config, android };
};
