import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../atoms/Icon'
import AdminAvatar from '../atoms/AdminAvatar'
import AdminNavItem from '../molecules/AdminNavItem'
import { useAuth } from '../../context'
import { useSetting } from '../../hooks/useSettings'

/**
 * AdminSidebar - Full sidebar component with role-based navigation
 * Mobile responsive with hamburger menu toggle
 */
function AdminSidebar({ pendingCount = 0 }) {
    const navigate = useNavigate()
    const { user, logout, isAdmin, isSeller } = useAuth()
    const { data: storeName } = useSetting('store_name')
    const [isOpen, setIsOpen] = useState(false)

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const closeSidebar = () => {
        setIsOpen(false)
    }

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-30">
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <Icon name="menu" size={24} />
                </button>
                <div className="flex items-center gap-2 text-primary font-bold text-lg">
                    <Icon name="storefront" size={24} />
                    <span>{storeName || 'TokoIndo'}</span>
                </div>
                <AdminAvatar
                    src={user?.avatar}
                    alt={user?.name || 'User'}
                    size="sm"
                />
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={closeSidebar}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 flex-shrink-0 
                border-r border-slate-200 dark:border-slate-800 
                bg-surface-light dark:bg-surface-dark 
                flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
                        <Icon name="storefront" size={24} />
                        <span className="truncate">{storeName || 'TokoIndo'}</span>
                        {isAdmin && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Admin</span>}
                        {!isAdmin && isSeller && <span className="text-xs bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded-full">Seller</span>}
                    </div>
                    {/* Close button for mobile */}
                    <button
                        onClick={closeSidebar}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <Icon name="close" size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-4">
                    {/* User Menu - All roles */}
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu Saya</h3>
                        <div className="space-y-1">
                            <AdminNavItem
                                to="/admin"
                                icon="dashboard"
                                label="Dashboard"
                                onClick={closeSidebar}
                            />
                            <AdminNavItem
                                to="/admin/orders"
                                icon="receipt_long"
                                label="Pesanan Saya"
                                onClick={closeSidebar}
                            />
                        </div>
                    </div>

                    {/* Seller Menu - Seller & Admin only */}
                    {isSeller && (
                        <div>
                            <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Penjualan</h3>
                            <div className="space-y-1">
                                <AdminNavItem to="/admin/products" icon="inventory_2" label="Daftar Produk" onClick={closeSidebar} />
                                <AdminNavItem to="/admin/categories" icon="category" label="Kategori" onClick={closeSidebar} />
                                <AdminNavItem to="/admin/sales" icon="point_of_sale" label="Pesanan" badge={pendingCount > 0 ? pendingCount : undefined} onClick={closeSidebar} />
                                <AdminNavItem to="/admin/analytics" icon="analytics" label="Statistik" onClick={closeSidebar} />
                                <AdminNavItem to="/admin/banners" icon="image" label="Banner" onClick={closeSidebar} />
                                <AdminNavItem to="/admin/customers" icon="people" label="Daftar Customer" onClick={closeSidebar} />
                            </div>
                        </div>
                    )}

                    {/* Admin Menu - Admin only */}
                    {isAdmin && (
                        <div>
                            <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Administrasi</h3>
                            <div className="space-y-1">
                                <AdminNavItem to="/admin/users" icon="group" label="Kelola Pengguna" onClick={closeSidebar} />
                                <AdminNavItem to="/admin/couriers" icon="two_wheeler" label="Kelola Kurir" onClick={closeSidebar} />
                                <AdminNavItem to="/admin/coupons" icon="confirmation_number" label="Kupon" onClick={closeSidebar} />
                                <AdminNavItem to="/admin/shipping" icon="local_shipping" label="Pengiriman" onClick={closeSidebar} />
                                <AdminNavItem to="/admin/reviews" icon="rate_review" label="Ulasan" onClick={closeSidebar} />
                            </div>
                        </div>
                    )}

                    {/* System - Admin only */}
                    {isAdmin && (
                        <div>
                            <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sistem</h3>
                            <div className="space-y-1">
                                <AdminNavItem to="/admin/settings" icon="settings" label="Pengaturan Toko" onClick={closeSidebar} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <AdminAvatar
                            src={user?.avatar}
                            alt={user?.name || 'User'}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                                {user?.name || 'User'}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">{user?.role || 'user'}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <Icon name="logout" size={20} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default AdminSidebar
