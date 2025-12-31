import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/client';

/**
 * Hook to fetch all products
 */
export function useProducts(params = {}) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const { data } = await productsApi.getAll(params);
            return data;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const { data } = await productsApi.getById(id);
            return data;
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
}

/**
 * Hook to create a new product (admin)
 */
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productData) => {
            const { data } = await productsApi.create(productData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}

/**
 * Hook to update a product (admin)
 */
export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }) => {
            const response = await productsApi.update(id, data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
        },
    });
}

/**
 * Hook to delete a product (admin)
 */
export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { data } = await productsApi.delete(id);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });
}
