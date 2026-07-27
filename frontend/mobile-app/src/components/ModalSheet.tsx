import type { ReactNode } from "react";
import { Modal, TouchableOpacity, View } from "react-native";

export interface ModalSheetProps {
  isVisible: boolean;
  onClose: () => void;
  /** Extra classes on the sheet itself — bottom padding, max height, etc. */
  sheetClassName?: string;
  children: ReactNode;
}

// Bottom-sheet shell shared by every modal in the app: dimmed scrim,
// tap-outside-to-close, rounded sheet with a grabber. Native renders it in a
// real Modal; the .web.tsx sibling renders an in-tree overlay instead (see
// that file for why). Mount it as a direct child of a full-screen view.
export default function ModalSheet({
  isVisible,
  onClose,
  sheetClassName = "pb-8",
  children,
}: ModalSheetProps) {
  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <TouchableOpacity className="flex-1" onPress={onClose} activeOpacity={1} />

        <View
          className={`bg-table-canvas border-t border-table-border rounded-t-3xl p-6 ${sheetClassName}`}
        >
          <View className="w-12 h-1 bg-table-border rounded-full mx-auto mb-4" />
          {children}
        </View>
      </View>
    </Modal>
  );
}
