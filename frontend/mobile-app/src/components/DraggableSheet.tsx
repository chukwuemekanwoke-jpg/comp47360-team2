import { ReactNode, useEffect, useMemo, useState } from "react";
import { Animated, LayoutChangeEvent, PanResponder, View } from "react-native";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";

interface DraggableSheetProps {
  /** Resting height as a fraction of the space the sheet is laid out over. */
  collapsedRatio?: number;
  /** Height once dragged fully open, as the same fraction. */
  expandedRatio?: number;
  /** Rendered inside the drag strip beside the grabber — a title, a count. */
  handle?: ReactNode;
  children: ReactNode;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi);
}

// Flick speed that decides the snap regardless of where the drag ended.
const FLICK_VELOCITY = 0.5;

export default function DraggableSheet({
  collapsedRatio = 0.4,
  expandedRatio = 0.9,
  handle,
  children,
}: DraggableSheetProps) {
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  const [available, setAvailable] = useState(0);
  const [height] = useState(() => new Animated.Value(0));

  const min = Math.round(available * collapsedRatio);
  const max = Math.round(available * expandedRatio);

  const [expanded, setExpanded] = useState(false);
  const resting = expanded ? max : min;

  useEffect(() => {
    if (available === 0) return;
    height.setValue(expanded ? max : min);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        // Claim only clear vertical drags, so taps and list scrolling still work.
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_, gesture) => {
          height.setValue(clamp(resting - gesture.dy, min, max));
        },
        onPanResponderRelease: (_, gesture) => {
          const dragged = resting - gesture.dy;
          const open =
            gesture.vy < -FLICK_VELOCITY
              ? true
              : gesture.vy > FLICK_VELOCITY
              ? false
              : dragged > (min + max) / 2;

          setExpanded(open);
          Animated.spring(height, {
            toValue: open ? max : min,
            useNativeDriver: false,
            bounciness: 0,
          }).start();
        },
      }),
    [height, min, max, resting]
  );

  return (
    <View
      // box-none passes touches above the sheet to the map; zIndex clears
      // Leaflet's panes on web.
      className="absolute inset-0 justify-end"
      style={{ zIndex: 1500 }}
      pointerEvents="box-none"
      onLayout={(e: LayoutChangeEvent) => setAvailable(e.nativeEvent.layout.height)}
    >
      <Animated.View
        // Plain styles an Animated value can't go through a NativeWind class.
        style={{
          height,
          backgroundColor: colors.canvas,
          borderTopWidth: 1,
          borderColor: colors.border,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
        }}
      >
        <View {...pan.panHandlers} className="pt-3 pb-2 px-4">
          <View
            className="w-12 h-1 rounded-full mx-auto mb-2"
            style={{ backgroundColor: colors.border }}
          />
          {handle}
        </View>
        {children}
      </Animated.View>
    </View>
  );
}
