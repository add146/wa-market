import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider, AuthProvider, ThemeProvider, SearchProvider, ToastProvider, WishlistProvider } from './context'
import './index.css'
import App from './App.jsx'

import { API_BASE_URL } from './api/client'

// Create Query Client with default options
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 2, // 2 minutes
        },
        mutations: {
            retry: 0,
        },
    },
})

async function resolveDomain() {
    const hostname = window.location.hostname;
    // Known platform domains that don't need resolution
    const platformDomains = ['localhost', '127.0.0.1', 'wa-market-web.pages.dev', 'wa-market.com', 'warung.my.id'];
    
    // Check if we already have /s/ in URL
    const pathname = window.location.pathname;
    const slugMatch = pathname.match(/^\/s\/([^/]+)/);
    
    if (slugMatch) {
       return { slug: slugMatch[1], basename: `/s/${slugMatch[1]}` };
    }

    if (platformDomains.includes(hostname) || hostname.endsWith('.pages.dev')) {
       return { slug: null, basename: '/' }; // It's just main platform
    }

    // Custom domain scenario
    try {
        const res = await fetch(`${API_BASE_URL}/resolver/domain/${hostname}`);
        if (res.ok) {
            const data = await res.json();
            if (data.found && data.isActive) {
                return { slug: data.slug, basename: '/' };
            }
        }
    } catch(e) { console.error('Domain resolve error:', e) }
    
    return { slug: null, basename: '/', isUnresolvedDomain: true };
}

resolveDomain().then(({ slug, basename, isUnresolvedDomain }) => {
    createRoot(document.getElementById('root')).render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <AuthProvider>
                        <WishlistProvider>
                            <CartProvider>
                                <SearchProvider>
                                    <ToastProvider>
                                        <BrowserRouter basename={basename}>
                                            {isUnresolvedDomain ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
                                                    <h2>Domain Not Found</h2>
                                                    <p>This custom domain has not been registered or is inactive on our platform.</p>
                                                </div>
                                            ) : (
                                                <App slug={slug} />
                                            )}
                                        </BrowserRouter>
                                    </ToastProvider>
                                </SearchProvider>
                            </CartProvider>
                        </WishlistProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </StrictMode>,
    )
})

