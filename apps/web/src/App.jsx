import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import MainLayout from './components/templates/MainLayout'
import AdminLayout from './components/templates/AdminLayout'
import LoadingState from './components/atoms/LoadingState'
import ProtectedRoute from './components/ProtectedRoute'

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))

// Admin pages
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage'))
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage'))
const AdminCategoriesPage = lazy(() => import('./pages/AdminCategoriesPage'))
const AdminCouponsPage = lazy(() => import('./pages/AdminCouponsPage'))
const AdminShippingPage = lazy(() => import('./pages/AdminShippingPage'))
const AdminReviewsPage = lazy(() => import('./pages/AdminReviewsPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'))
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'))
const AdminNotFoundPage = lazy(() => import('./pages/AdminNotFoundPage'))

function App() {
    return (
        <Routes>
            {/* Auth Routes */}
            <Route
                path="/login"
                element={
                    <Suspense fallback={<LoadingState />}>
                        <LoginPage />
                    </Suspense>
                }
            />
            <Route
                path="/unauthorized"
                element={
                    <Suspense fallback={<LoadingState />}>
                        <UnauthorizedPage />
                    </Suspense>
                }
            />

            {/* Admin routes with AdminLayout */}
            <Route
                path="/admin/*"
                element={
                    <ProtectedRoute requiredRole="user" redirectTo="/login">
                        <AdminLayout>
                            <Suspense fallback={<LoadingState />}>
                                <Routes>
                                    {/* Dashboard - All authenticated users */}
                                    <Route index element={<AdminDashboardPage />} />

                                    {/* User routes - All authenticated users */}
                                    <Route path="orders" element={<AdminOrdersPage />} />

                                    {/* Seller routes - Seller & Admin */}
                                    <Route path="products" element={
                                        <ProtectedRoute requiredRole="seller" redirectTo="/unauthorized">
                                            <AdminProductsPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="sales" element={
                                        <ProtectedRoute requiredRole="seller" redirectTo="/unauthorized">
                                            <AdminOrdersPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="analytics" element={
                                        <ProtectedRoute requiredRole="seller" redirectTo="/unauthorized">
                                            <AdminAnalyticsPage />
                                        </ProtectedRoute>
                                    } />

                                    {/* Admin routes - Admin only */}
                                    <Route path="verifications" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminOrdersPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="users" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminUsersPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="categories" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminCategoriesPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="coupons" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminCouponsPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="shipping" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminShippingPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="reviews" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminReviewsPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="settings" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminSettingsPage />
                                        </ProtectedRoute>
                                    } />

                                    <Route path="*" element={<AdminNotFoundPage />} />
                                </Routes>
                            </Suspense>
                        </AdminLayout>
                    </ProtectedRoute>
                }
            />

            {/* Product Detail has its own layout */}
            <Route
                path="/product/:id"
                element={
                    <Suspense fallback={<LoadingState />}>
                        <ProductDetailPage />
                    </Suspense>
                }
            />

            {/* Cart has its own layout */}
            <Route
                path="/cart"
                element={
                    <Suspense fallback={<LoadingState />}>
                        <CartPage />
                    </Suspense>
                }
            />

            {/* Checkout has its own layout */}
            <Route
                path="/checkout"
                element={
                    <Suspense fallback={<LoadingState />}>
                        <CheckoutPage />
                    </Suspense>
                }
            />

            {/* Other pages use MainLayout */}
            <Route
                path="*"
                element={
                    <MainLayout>
                        <Suspense fallback={<LoadingState />}>
                            <Routes>
                                <Route path="/" element={<HomePage />} />
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                        </Suspense>
                    </MainLayout>
                }
            />
        </Routes>
    )
}

export default App




