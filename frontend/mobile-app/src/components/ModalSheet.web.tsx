import { TouchableOpacity, View } from "react-native";
import type { ModalSheetProps } from "./ModalSheet";

// Web port of the bottom-sheet shell.
//
// react-native-web's Modal portals its children into a <div> appended to
// document.body (see react-native-web/dist/exports/Modal/ModalPortal.js).
// That div is a *sibling* of the app root, so it sits above the
// <View style={themeVars[theme]}> that defines --table-canvas, --table-cream
// and friends. CSS custom properties only inherit downwards, so inside the
// portal every one of them is undefined: `bg-table-canvas` resolves to
// `rgb(var(--table-canvas) / 1)`, the browser drops the invalid declaration,
// and the sheet renders fully transparent with invisible text.
//
// Rendering the overlay in-tree keeps it inside the theme cascade, so the
// same Tailwind classes work and follow the light/dark toggle. The trade-off
// is that `absolute inset-0` anchors to the nearest positioned ancestor —
// mount this as a direct child of a full-screen view.
export default function ModalSheet({
  isVisible,
  onClose,
  sheetClassName = "pb-8",
  children,
}: ModalSheetProps) {
  // No portal here, so the overlay is always mounted — bail out when hidden.
  if (!isVisible) return null;

  return (
    // z-index has to clear in-page overlays that raise themselves (e.g. the
    // map's z-[1000] List View button), since those aren't in a separate
    // stacking context the way a real Modal's portal would be.
    <View className="absolute inset-0 z-[2000] justify-end bg-black/60">
      <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />

      <View
        className={`bg-table-canvas border-t border-table-border rounded-t-3xl p-6 ${sheetClassName}`}
      >
        <View className="w-12 h-1 bg-table-border rounded-full mx-auto mb-4" />
        {children}
      </View>
    </View>
  );
}
