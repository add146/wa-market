import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_BASE_URL } from '../api/client'

// Global generic API client since we are not in a tenant yet
const globalApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
})

/**
 * Register a new store to the SaaS platform
 */
export function useRegisterStore() {
    return useMutation({
        mutationFn: async (storeData) => {
            const { data } = await globalApi.post('/stores/register', storeData)
            return data
        }
    })
}

/**
 * Check if a slug is available
 * Enabled only if slug length >= 3
 */
export function useCheckSlug(slug) {
    return useQuery({
        queryKey: ['checkSlug', slug],
        queryFn: async () => {
            if (!slug) return { available: false }
            const { data } = await globalApi.get(`/stores/${slug}/check`)
            return data
        },
        enabled: !!slug && slug.length >= 3,
        staleTime: 30000 // Cache checks for 30s
    })
}
