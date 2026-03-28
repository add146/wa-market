import { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client'; // Assuming there is an API client here

import { setStoreSlug } from '../api/client';

const StoreContext = createContext();

export function StoreProvider({ children, manualSlug }) {
    const slug = manualSlug;
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!slug) return;

        const fetchStoreParams = async () => {
            setLoading(true);
            try {
                // Initialize the api client with the slug
                setStoreSlug(slug);

                // Fetch public store details by slug
                const response = await api.get(`/stores/${slug}`);
                setStore(response.data);
                setError(null);
            } catch (err) {
                console.error('Failed to load store:', err);
                setError('Store not found or unavailable');
                // navigate('/404-store'); // Optional: redirect to custom 404
            } finally {
                setLoading(false);
            }
        };

        fetchStoreParams();
    }, [slug, navigate]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 max-w-md w-full">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Toko Tidak Ditemukan</h1>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        );
    }

    return (
        <StoreContext.Provider value={{ store, loading, error, slug }}>
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const context = useContext(StoreContext);
    if (!context) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
}
