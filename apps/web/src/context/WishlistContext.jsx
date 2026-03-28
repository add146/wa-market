import { createContext, useContext, useState, useEffect } from 'react';
import { wishlistsApi } from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [wishlists, setWishlists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchWishlists = async () => {
        if (!isAuthenticated) {
            setWishlists([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await wishlistsApi.getAll();
            setWishlists(res.data?.wishlists || []);
        } catch (error) {
            console.error('Failed to fetch wishlists', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlists();
    }, [isAuthenticated, user]);

    const toggleWishlist = async (productId) => {
        if (!isAuthenticated) return false;
        
        // Optimistic update
        const isCurrentlyWishlisted = wishlists.some(w => w.productId === productId);
        if (isCurrentlyWishlisted) {
            setWishlists(prev => prev.filter(w => w.productId !== productId));
        } else {
            // Optimistically add a fake wishlist record so UI updates instantly
            setWishlists(prev => [{ productId, id: 'temp' }, ...prev]);
        }

        try {
            const res = await wishlistsApi.toggle(productId);
            // Re-fetch to get correct data/IDs
            fetchWishlists();
            return res.data?.isWishlisted;
        } catch (error) {
            console.error('Toggle wishlist failed', error);
            // Revert on failure
            fetchWishlists();
            return isCurrentlyWishlisted;
        }
    };

    const isWishlisted = (productId) => {
        return wishlists.some(w => w.productId === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlists, isLoading, toggleWishlist, isWishlisted, fetchWishlists }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    return useContext(WishlistContext);
}
