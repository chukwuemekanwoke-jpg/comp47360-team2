import { Platform } from "react-native";
import MapScreenNative from "./MapTab.native";
import MapScreenWeb from "./MapTab.web";

const MapScreen = Platform.select({
  native: MapScreenNative,
  web: MapScreenWeb,
  default: MapScreenNative,
});

export default MapScreen as any;
