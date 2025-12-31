import { useQuery } from '@tanstack/react-query';
import { settingsApi, shippingApi } from '../api/client';

/**
 * Hook to fetch all store settings
 */
export function useSettings() {
    return useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await settingsApi.getAll();
            return data;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

/**
 * Hook to get a specific setting by key
 */
export function useSetting(key) {
    const { data: settings, ...rest } = useSettings();
    return {
        data: settings?.[key],
        settings,
        ...rest,
    };
}

/**
 * Hook to fetch all shipping options
 */
export function useShippingOptions() {
    return useQuery({
        queryKey: ['shipping-options'],
        queryFn: async () => {
            const { data } = await shippingApi.getAll();
            return data;
        },
        staleTime: 1000 * 60 * 5,
    });
}
