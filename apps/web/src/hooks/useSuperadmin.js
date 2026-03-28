import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from '../api/client'
import axios from 'axios'

// Authenticated global API client (no slug prefix)
const superAdminApi = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
})
superAdminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('sa_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// ─── Auth ───────────────────────────

export function useSuperadminLogin() {
    return useMutation({
        mutationFn: async ({ phone, password }) => {
            const { data } = await superAdminApi.post('/superadmin/auth/login', { phone, password })
            return data
        },
        onSuccess: (data) => {
            if (data.token) {
                localStorage.setItem('sa_token', data.token)
            }
        }
    })
}

export function useSuperadminSession() {
    return useQuery({
        queryKey: ['sa-session'],
        queryFn: async () => {
            const { data } = await superAdminApi.get('/superadmin/auth/session')
            return data
        },
        retry: false,
        staleTime: 60000,
    })
}

export function useSuperadminLogout() {
    return useMutation({
        mutationFn: async () => {
            await superAdminApi.post('/superadmin/auth/logout')
            localStorage.removeItem('sa_token')
        }
    })
}

// ─── Platform Stats ─────────────────

export function usePlatformStats() {
    return useQuery({
        queryKey: ['sa-platform-stats'],
        queryFn: async () => {
            const { data } = await superAdminApi.get('/superadmin/stats')
            return data
        },
        staleTime: 30000,
    })
}

// ─── Store Management ───────────────

export function useGetAllStores() {
    return useQuery({
        queryKey: ['sa-stores'],
        queryFn: async () => {
            const { data } = await superAdminApi.get('/superadmin/stores')
            return data
        }
    })
}

export function useUpdateStorePlan() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ storeId, plan }) => {
            const { data } = await superAdminApi.patch(`/superadmin/stores/${storeId}/plan`, { plan })
            return data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-stores'] })
            qc.invalidateQueries({ queryKey: ['sa-platform-stats'] })
        }
    })
}

export function useUpdateStoreDomain() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async ({ storeId, customDomain }) => {
            const { data } = await superAdminApi.patch(`/superadmin/stores/${storeId}/domain`, { customDomain })
            return data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-stores'] })
        }
    })
}

export function useToggleStore() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (storeId) => {
            const { data } = await superAdminApi.patch(`/superadmin/stores/${storeId}/toggle`)
            return data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-stores'] })
            qc.invalidateQueries({ queryKey: ['sa-platform-stats'] })
        }
    })
}

export function useDeleteStore() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (storeId) => {
            const { data } = await superAdminApi.delete(`/superadmin/stores/${storeId}`)
            return data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-stores'] })
            qc.invalidateQueries({ queryKey: ['sa-platform-stats'] })
        }
    })
}

export function useSuperadminSettings() {
    return useQuery({
        queryKey: ['sa-settings'],
        queryFn: async () => {
            const { data } = await superAdminApi.get('/superadmin/settings')
            return data
        }
    })
}

export function useUpdateSuperadminSettings() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: async (settings) => {
            const { data } = await superAdminApi.put('/superadmin/settings', settings)
            return data
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sa-settings'] })
        }
    })
}
