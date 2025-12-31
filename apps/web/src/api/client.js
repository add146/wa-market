import axios from 'axios';

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.error || error.message || 'Terjadi kesalahan';
        console.error('API Error:', message);
        return Promise.reject(new Error(message));
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
    delete: (id) => api.delete(`/orders/${id}`),
};

export const cartApi = {
    get: () => api.get('/cart'),
    add: (data) => api.post('/cart', data),
    update: (id, data) => api.put(`/cart/${id}`, data),
    remove: (id) => api.delete(`/cart/${id}`),
    clear: () => api.delete('/cart'),
};

export const settingsApi = {
    getAll: () => api.get('/settings'),
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
