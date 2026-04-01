import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import MainLayout from './components/templates/MainLayout'
import AdminLayout from './components/templates/AdminLayout'
import LoadingState from './components/atoms/LoadingState'
import ProtectedRoute from './components/ProtectedRoute'
import { StoreProvider } from './context/StoreContext'
import { Navigate } from 'react-router-dom'

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/saas/LandingPage'))
const SuperAdminPage = lazy(() => import('./pages/saas/SuperAdminPage'))
const SuperAdminLoginPage = lazy(() => import('./pages/saas/SuperAdminLoginPage'))
const SubscriptionPage = lazy(() => import('./pages/saas/SubscriptionPage'))

// Lazy load pages for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'))
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage'))
const CourierDashboardPage = lazy(() => import('./pages/CourierDashboardPage'))
const PaymentStatusPage = lazy(() => import('./pages/PaymentStatusPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const MyLibraryPage = lazy(() => import('./pages/MyLibraryPage'))
const CoursePlayerPage = lazy(() => import('./pages/CoursePlayerPage'))
const EbookReaderPage = lazy(() => import('./pages/EbookReaderPage'))

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
const AdminBannersPage = lazy(() => import('./pages/AdminBannersPage'))
const AdminCustomersPage = lazy(() => import('./pages/AdminCustomersPage'))
const AdminNotFoundPage = lazy(() => import('./pages/AdminNotFoundPage'))
const AdminCouriersPage = lazy(() => import('./pages/AdminCouriersPage'))
const AdminLMSStudioPage = lazy(() => import('./pages/admin/AdminLMSStudioPage'))

function StorefrontApp() {
    return (
        <Routes>
            <Route
                path="/wishlist"
                element={
                    <ProtectedRoute requiredRole="user" redirectTo="/login">
                        <Suspense fallback={<LoadingState />}>
                            <WishlistPage />
                        </Suspense>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/account"
                element={
                    <ProtectedRoute requiredRole="user" redirectTo="/login">
                        <Suspense fallback={<LoadingState />}>
                            <AccountPage />
                        </Suspense>
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/login"
                element={
                    <Suspense fallback={<LoadingState />}>
                        <LoginPage />
                    </Suspense>
                }
            />
            <Route
                path="/register"
                element={
                    <Suspense fallback={<LoadingState />}>
                        <RegisterPage />
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
                                    <Route path="banners" element={
                                        <ProtectedRoute requiredRole="seller" redirectTo="/unauthorized">
                                            <AdminBannersPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="lms-studio/:id" element={
                                        <ProtectedRoute requiredRole="seller" redirectTo="/unauthorized">
                                            <AdminLMSStudioPage />
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
                                    <Route path="couriers" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminCouriersPage />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="customers" element={
                                        <ProtectedRoute requiredRole="admin" redirectTo="/unauthorized">
                                            <AdminCustomersPage />
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

            {/* Courier Dashboard is fully standalone */}
            <Route
                path="/courier"
                element={
                    <ProtectedRoute requiredRole="courier" redirectTo="/login">
                        <Suspense fallback={<LoadingState />}>
                            <CourierDashboardPage />
                        </Suspense>
                    </ProtectedRoute>
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

            {/* My Orders - Customer can view their orders */}
            <Route
                path="/my-orders"
                element={
                    <ProtectedRoute requiredRole="user" redirectTo="/login">
                        <Suspense fallback={<LoadingState />}>
                            <MyOrdersPage />
                        </Suspense>
                    </ProtectedRoute>
                }
            />

            {/* My Library - Ebooks & Courses */}
            <Route
                path="/my-library"
                element={
                    <ProtectedRoute requiredRole="user" redirectTo="/login">
                        <Suspense fallback={<LoadingState />}>
                            <MyLibraryPage />
                        </Suspense>
                    </ProtectedRoute>
                }
            />

            {/* Ebook Reader Player */}
            <Route
                path="/ebooks/:id"
                element={
                    <ProtectedRoute requiredRole="user" redirectTo="/login">
                        <Suspense fallback={<LoadingState />}>
                            <EbookReaderPage />
                        </Suspense>
                    </ProtectedRoute>
                }
            />

            {/* Course Content Player */}
            <Route
                path="/classes/:id"
                element={
                    <ProtectedRoute requiredRole="user" redirectTo="/login">
                        <Suspense fallback={<LoadingState />}>
                            <CoursePlayerPage />
                        </Suspense>
                    </ProtectedRoute>
                }
            />

            {/* Payment Status */}
            <Route
                path="/payment-status/:orderId"
                element={
                    <Suspense fallback={<LoadingState />}>
                        <PaymentStatusPage />
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

function App({ slug }) {
    if (slug) {
        return (
            <StoreProvider manualSlug={slug}>
                <StorefrontApp />
            </StoreProvider>
        )
    }

    // Global SaaS Landing Page
    return (
        <Routes>
            <Route path="/superadmin/login" element={
                 <Suspense fallback={<LoadingState />}>
                    <SuperAdminLoginPage />
                 </Suspense>
            } />
            <Route path="/superadmin" element={
                 <Suspense fallback={<LoadingState />}>
                    <SuperAdminPage />
                 </Suspense>
            } />
            <Route path="/" element={
                 <Suspense fallback={<LoadingState />}>
                    <LandingPage />
                 </Suspense>
            } />
            <Route path="/subscription" element={
                 <Suspense fallback={<LoadingState />}>
                    <SubscriptionPage />
                 </Suspense>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App




