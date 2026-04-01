import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ebooksApi } from '../api/client'

export const useMyLibrary = () => {
    return useQuery({
        queryKey: ['ebooks', 'my-library'],
        queryFn: async () => {
            const res = await ebooksApi.getMyLibrary()
            return res.data
        }
    })
}

export const useEbookAccess = (productId) => {
    return useQuery({
        queryKey: ['ebooks', 'access', productId],
        queryFn: async () => {
            if (!productId) return { hasAccess: false }
            const res = await ebooksApi.checkAccess(productId)
            return res.data
        },
        enabled: !!productId
    })
}

export const useUpdateEbookProgress = () => {
    const queryClient = useQueryClient()
    
    return useMutation({
        mutationFn: ({ productId, page, lastCfi, totalPages }) => 
            ebooksApi.updateProgress(productId, { page, lastCfi, totalPages }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ebooks', 'my-library'] })
        }
    })
}

export const useBookmarks = (productId) => {
    return useQuery({
        queryKey: ['ebooks', 'bookmarks', productId],
        queryFn: async () => {
            const res = await ebooksApi.getBookmarks(productId)
            return res.data
        },
        enabled: !!productId
    })
}

export const useAddBookmark = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ productId, data }) => ebooksApi.addBookmark(productId, data),
        onSuccess: (_, { productId }) => {
            queryClient.invalidateQueries({ queryKey: ['ebooks', 'bookmarks', productId] })
        }
    })
}

export const useUpdateBookmark = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }) => ebooksApi.updateBookmark(id, data),
        onSuccess: (res) => {
            const productId = res.data.bookmark.productId
            queryClient.invalidateQueries({ queryKey: ['ebooks', 'bookmarks', productId] })
        }
    })
}

export const useDeleteBookmark = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, productId }) => ebooksApi.deleteBookmark(id),
        onSuccess: (_, { productId }) => {
            queryClient.invalidateQueries({ queryKey: ['ebooks', 'bookmarks', productId] })
        }
    })
}
