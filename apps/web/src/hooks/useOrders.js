import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, couponsApi } from '../api/client';

/**
 * Hook to fetch all orders
 */
export function useOrders() {
    return useQuery({
        queryKey: ['orders'],
        queryFn: async () => {
            const { data } = await ordersApi.getAll();
            return data;
        },
    });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id) {
    return useQuery({
        queryKey: ['order', id],
        queryFn: async () => {
            const { data } = await ordersApi.getById(id);
            return data;
        },
        enabled: !!id,
    });
}

/**
 * Hook to create a new order (checkout)
 * Returns the order data + WhatsApp URL
 */
export function useCreateOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderData) => {
            const { data } = await ordersApi.create(orderData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });
}

/**
 * Hook to approve an order (admin)
 */
export function useApproveOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { data } = await ordersApi.approve(id);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

/**
 * Hook to delete an order (admin)
 */
export function useDeleteOrder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { data } = await ordersApi.delete(id);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

/**
 * Hook to validate a coupon code
 */
export function useValidateCoupon() {
    return useMutation({
        mutationFn: async ({ code, subtotal }) => {
            const { data } = await couponsApi.validate(code, subtotal);
            return data;
        },
    });
}
