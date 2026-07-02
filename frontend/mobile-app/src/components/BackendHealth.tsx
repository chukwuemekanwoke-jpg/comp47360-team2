import { Text, ActivityIndicator, View } from "react-native";
import { useGetHealthQuery } from "@shared";

interface BackendHealthCardProps {
    title?: string;
    onStatusChecked?: (status: 'online' | 'offline') => void;
}


export default function BackendHealthCard({
    title='Backend Health Gateway',
    onStatusChecked
}: BackendHealthCardProps) {
    const {data, isLoading, isError, refetch} = useGetHealthQuery(undefined, {
        pollingInterval: 30000,
    });
    const isHealthy = data?.status === 'ok' || data?.status === 'health'
        // Trigger optional callback notification if provided
    if (!isLoading && onStatusChecked) {
        onStatusChecked(isHealthy && !isError ? 'online' : 'offline');
    }

    return (
        <View className="bg-table-surface border border-table-border rounded-2xl p-4 flex-row items-center justify-between mb-3">
        <View className="flex-1 mr-2">
            <Text className="text-sm font-bold text-table-cream">{title}</Text>
            <Text className="text-xs text-table-gold mt-0.5">
            {isLoading ? "Checking API context..." : isHealthy && !isError ? "All systems operational" : "Gateway unreachable"}
            </Text>
        </View>

        {isLoading ? (
            <ActivityIndicator size="small" color="#10b981" />
        ) : (
            <View className="flex-row items-center gap-2">
            {/* Status Dot */}
            <View 
                className={`w-2.5 h-2.5 rounded-full ${isHealthy && !isError ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`}
                style={{ shadowRadius: 4, shadowOpacity: 0.5 }}
            />
            <Text 
                className={`text-xs font-bold uppercase tracking-wider ${isHealthy && !isError ? 'text-emerald-500' : 'text-rose-500'}`}
                onPress={() => refetch()} // Tap status label to manually force re-ping
            >
                {isHealthy && !isError ? "Online" : "Offline"}
            </Text>
            </View>
        )}
        </View>
    );
};