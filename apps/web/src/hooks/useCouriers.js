import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couriersApi, ordersApi } from '../api/client';

// -------------- ADMIN HOOKS --------------

export const useAdminCouriers = () => {
    return useQuery({
        queryKey: ['adminCouriers'],
        queryFn: async () => {
            const { data } = await couriersApi.getAll();
            return data;
        },
    });
};

export const useCreateCourier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (courierData) => {
            const { data } = await couriersApi.create(courierData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCouriers'] });
        },
    });
};

export const useDeleteCourier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { data } = await couriersApi.delete(id);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCouriers'] });
        },
    });
};

export const useAssignCourier = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, courierId }) => {
            const { data } = await ordersApi.assignCourier(orderId, { courierId });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
};

// -------------- COURIER HOOKS --------------

export const useCourierDeliveries = (statusFilter = null) => {
    return useQuery({
        queryKey: ['courierDeliveries', statusFilter],
        queryFn: async () => {
            const params = statusFilter ? { status: statusFilter } : {};
            const { data } = await couriersApi.getDeliveries(params);
            return data;
        },
    });
};

export const useCourierDelivery = (id) => {
    return useQuery({
        queryKey: ['courierDelivery', id],
        queryFn: async () => {
            const { data } = await couriersApi.getDeliveryById(id);
            return data;
        },
        enabled: !!id,
    });
};

export const useUpdateDeliveryStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status, notes, photoUrl }) => {
            const { data } = await couriersApi.updateDeliveryStatus(id, { status, notes, photoUrl });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courierDeliveries'] });
            queryClient.invalidateQueries({ queryKey: ['courierDelivery'] });
        },
    });
};
