import axios from 'axios';
import imageCompression from 'browser-image-compression';

// Base API URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Dynamic slug for multi-tenant
export let currentStoreSlug = '';

export const setStoreSlug = (slug) => {
    if (slug) {
        currentStoreSlug = slug;
    }
};

// Request interceptor to add auth token and tenant slug
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject tenant slug: /s/:slug
    if (currentStoreSlug && config.url) {
        // If it's not a global route, inject the slug prefix
        const isGlobalRoute = config.url.startsWith('/stores') || 
                              config.url.startsWith('/upload') || 
                              config.url.startsWith('/health');
        
        if (!isGlobalRoute) {
            const separator = config.url.startsWith('/') ? '' : '/';
            config.url = `/s/${currentStoreSlug}${separator}${config.url}`;
        }
    }

    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        // Prevent Cloudflare Pages fallback HTML from crashing the app
        if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
            return Promise.reject(new Error('API Error: Endpoint returned HTML. Backend is likely unreachable.'));
        }
        return response;
    },
    (error) => {
        const message = error.response?.data?.error || error.message || 'Terjadi kesalahan';
        const details = error.response?.data?.details;
        console.error('API Error:', message, details ? details : '');

        // Handle 401 Unauthorized - clear stale token and redirect to login
        if (error.response?.status === 401) {
            console.log('Session expired or invalid - clearing token');
            localStorage.removeItem('auth_token');
            // Only redirect to login if not already on login page
            if (!window.location.pathname.includes('/login')) {
                alert('Sesi Anda telah berakhir. Silakan login kembali.');
                window.location.href = '/login';
            }
        }

        // Create error with response attached for detailed handling
        const err = new Error(message);
        err.response = error.response;
        err.details = details;
        return Promise.reject(err);
    }
);

export default api;

// API endpoints
export const productsApi = {
    getAll: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

export const categoriesApi = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

export const ordersApi = {
    getAll: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    create: (data) => api.post('/orders', data),
    approve: (id) => api.patch(`/orders/${id}/approve`),
    updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
    delete: (id) => api.delete(`/orders/${id}`),
    assignCourier: (id, data) => api.post(`/orders/${id}/assign-courier`, data),
    deliverDigital: (id) => api.patch(`/orders/${id}/deliver-digital`),
};

export const couriersApi = {
    // Admin
    getAll: () => api.get('/couriers/admin'),
    create: (data) => api.post('/couriers/admin', data),
    delete: (id) => api.delete(`/couriers/admin/${id}`),
    getDeliveriesByCourier: (courierId) => api.get(`/couriers/admin/${courierId}/deliveries`),
    // Courier Dashboard
    getDeliveries: (params) => api.get('/couriers/deliveries', { params }),
    getDeliveryById: (id) => api.get(`/couriers/deliveries/${id}`),
    updateDeliveryStatus: (id, data) => api.patch(`/couriers/deliveries/${id}`, data),
};

export const cartApi = {
    get: () => api.get('/cart'),
    add: (data) => api.post('/cart', data),
    update: (id, data) => api.put(`/cart/${id}`, data),
    remove: (id) => api.delete(`/cart/${id}`),
    clear: () => api.delete('/cart'),
};

export const settingsApi = {
    getAll: () => api.get('/settings'), // Public only
    getAdminAll: () => api.get('/settings/admin/all'), // Admin only (all keys)
    get: (key) => api.get(`/settings/${key}`),
    update: (key, value) => api.put(`/settings/${key}`, { value }),
};

export const shippingApi = {
    getAll: () => api.get('/shipping-options'),
    calculate: (data) => api.post('/shipping-options/calculate', data),
};

export const couponsApi = {
    validate: (code, subtotal) => api.post('/coupons/validate', { code, subtotal }),
};

export const authApi = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    session: () => api.get('/auth/session'),
};

export const reviewsApi = {
    getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
};

export const wishlistsApi = {
    getAll: () => api.get('/wishlists'),
    toggle: (productId) => api.post('/wishlists', { productId }),
    check: (productId) => api.get(`/wishlists/check/${productId}`),
};

export const uploadApi = {
    upload: async (file) => {
        const formData = new FormData();
        try {
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                initialQuality: 0.8
            });
            formData.append('image', compressedFile);
        } catch (error) {
            console.error('Image compression failed', error);
            formData.append('image', file); // fallback
        }
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadMultiple: async (files) => {
        const formData = new FormData();
        for (const file of files) {
            try {
                const compressedFile = await imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                    initialQuality: 0.8
                });
                formData.append('images', compressedFile);
            } catch (error) {
                formData.append('images', file); // fallback
            }
        }
        return api.post('/upload/multiple', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    delete: (filename) => api.delete(`/upload/${filename}`),
};

// RajaOngkir Shipping API
export const rajaongkirApi = {
    searchDestination: (query) => api.get(`/shipping/search?q=${encodeURIComponent(query)}`),
    calculateCost: (data) => api.post('/shipping/calculate', data),
    getCouriers: () => api.get('/shipping/couriers'),
};

// Payment API
export const paymentApi = {
    create: (orderId, provider) => api.post('/payment/create', { orderId, provider }),
    status: (orderId) => api.get(`/payment/status/${orderId}`),
};

