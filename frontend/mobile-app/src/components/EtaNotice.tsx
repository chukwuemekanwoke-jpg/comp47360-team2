import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { EtaResult } from "@shared/types";
import { useAppSelector } from "@shared/hooks";
import { navColors } from "@/theme";

interface EtaNoticeProps {
  etaResult?: EtaResult;
  isFetching: boolean;
  /**
   * Opening sentence of the "you can make it" state — each flow words its own
   * commitment ("This books a table…", "Claiming books a table…").
   */
  readyLead: string;
  /** Optional extra sentence on the too-far state, e.g. suggesting another mode. */
  tooFarHint?: string;
  /** Rendered when no ETA is available (query skipped, or no location yet). */
  fallback: ReactNode;
}

// Travel-time verdict shown before any action that creates an immediate
// booking. Spells out that the booking is for now and how long the table is
// held, using the server's own etaMinutes/holdWindowMinutes rather than
// etaResult.message so the immediacy is stated alongside the numbers.
export default function EtaNotice({
  etaResult,
  isFetching,
  readyLead,
  tooFarHint,
  fallback,
}: EtaNoticeProps) {
  const colors = navColors[useAppSelector((state) => state.settings.theme)];
  const canBook = etaResult ? etaResult.canBook : true;

  return (
    <View
      className={`rounded-xl p-3 mb-4 border ${
        isFetching
          ? "bg-table-border border-table-border"
          : canBook
          ? "bg-table-live/10 border-table-live/30"
          : "bg-red-500/10 border-red-500/30"
      }`}
    >
      {isFetching ? (
        <View className="flex-row items-center gap-2">
          <ActivityIndicator size="small" color={colors.gold} />
          <Text className="text-[11px] text-table-gold">Calculating travel time…</Text>
        </View>
      ) : etaResult ? (
        <Text
          className={`text-[11px] leading-relaxed ${canBook ? "text-table-live" : "text-red-400"}`}
        >
          {canBook
            ? `✓ ${readyLead} Estimated travel time ${etaResult.etaMinutes} min — your table is `
              + `held for ${etaResult.holdWindowMinutes} min after you confirm.`
            : `⚠ Too far to hold. Estimated travel time is ${etaResult.etaMinutes} min, but this `
              + `table is only held for ${etaResult.holdWindowMinutes} min.`
              + (tooFarHint ? ` ${tooFarHint}` : "")}
        </Text>
      ) : (
        fallback
      )}
    </View>
  );
}
