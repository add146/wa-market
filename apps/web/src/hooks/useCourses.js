import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { coursesApi } from '../api/client'

// ADMIN HOOKS
export const useCourseCurriculum = (productId) => {
    return useQuery({
        queryKey: ['courses', 'curriculum', productId],
        queryFn: async () => {
            const res = await coursesApi.getCurriculum(productId)
            return res.data
        },
        enabled: !!productId
    })
}

export const useCreateSection = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ productId, data }) => coursesApi.createSection(productId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum', variables.productId] })
        }
    })
}

export const useUpdateSection = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ sectionId, data }) => coursesApi.updateSection(sectionId, data),
        onSuccess: (_, variables) => {
            // We invalidate all curriculum queries since we don't know the productId here easily
            // or we could pass productId in variables
            if (variables.productId) {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum', variables.productId] })
            } else {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum'] })
            }
        }
    })
}

export const useDeleteSection = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ sectionId }) => coursesApi.deleteSection(sectionId),
        onSuccess: (_, variables) => {
            if (variables.productId) {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum', variables.productId] })
            } else {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum'] })
            }
        }
    })
}

export const useCreateLesson = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ sectionId, data }) => coursesApi.createLesson(sectionId, data),
        onSuccess: (_, variables) => {
            if (variables.productId) {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum', variables.productId] })
            } else {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum'] })
            }
        }
    })
}

export const useUpdateLesson = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ lessonId, data }) => coursesApi.updateLesson(lessonId, data),
        onSuccess: (_, variables) => {
            if (variables.productId) {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum', variables.productId] })
            } else {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum'] })
            }
        }
    })
}

export const useDeleteLesson = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ lessonId }) => coursesApi.deleteLesson(lessonId),
        onSuccess: (_, variables) => {
            if (variables.productId) {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum', variables.productId] })
            } else {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum'] })
            }
        }
    })
}

export const useReorderSections = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ productId, data }) => coursesApi.reorderSections(productId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum', variables.productId] })
        }
    })
}

export const useReorderLessons = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ sectionId, data }) => coursesApi.reorderLessons(sectionId, data),
        onSuccess: (_, variables) => {
            if (variables.productId) {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum', variables.productId] })
            } else {
                queryClient.invalidateQueries({ queryKey: ['courses', 'curriculum'] })
            }
        }
    })
}


// STUDENT HOOKS
export const useMyCourses = () => {
    return useQuery({
        queryKey: ['courses', 'my-courses'],
        queryFn: async () => {
            const res = await coursesApi.getMyCourses()
            return res.data
        }
    })
}

export const useCoursePlayer = (productId) => {
    return useQuery({
        queryKey: ['courses', 'player', productId],
        queryFn: async () => {
            const res = await coursesApi.getPlayer(productId)
            return res.data
        },
        enabled: !!productId
    })
}

export const useCompleteLesson = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ productId, lessonId }) => coursesApi.completeLesson(productId, lessonId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['courses', 'player', variables.productId] })
            queryClient.invalidateQueries({ queryKey: ['courses', 'my-courses'] })
        }
    })
}
