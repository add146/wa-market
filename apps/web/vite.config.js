import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        sourcemap: false,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    leaflet: ['leaflet', 'react-leaflet'],
                    query: ['@tanstack/react-query'],
                    admin: [
                        './src/pages/AdminDashboardPage.jsx',
                        './src/pages/AdminOrdersPage.jsx',
                        './src/pages/AdminProductsPage.jsx',
                        './src/pages/AdminSettingsPage.jsx'
                    ]
                }
            }
        }
    }
})
