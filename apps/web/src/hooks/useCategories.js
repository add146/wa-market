import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../api/client';

/**
 * Hook to fetch all categories
 */
export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await categoriesApi.getAll();
            return data;
        },
        staleTime: 1000 * 60 * 10, // 10 minutes
    });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(id) {
    return useQuery({
        queryKey: ['category', id],
        queryFn: async () => {
            const { data } = await categoriesApi.getById(id);
            return data;
        },
        enabled: !!id,
    });
}
