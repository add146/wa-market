import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CartProvider, AuthProvider, ThemeProvider, SearchProvider, ToastProvider } from './context'
import './index.css'
import App from './App.jsx'

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

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <SearchProvider>
                            <ToastProvider>
                                <BrowserRouter>
                                    <App />
                                </BrowserRouter>
                            </ToastProvider>
                        </SearchProvider>
                    </CartProvider>
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    </StrictMode>,
)

