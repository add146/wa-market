import { useNavigate } from 'react-router-dom'
import Icon from '../atoms/Icon'
import AdminAvatar from '../atoms/AdminAvatar'
import AdminNavItem from '../molecules/AdminNavItem'
import { useAuth } from '../../context'
import { useSetting } from '../../hooks/useSettings'

/**
 * AdminSidebar - Full sidebar component with role-based navigation
 * - User: Orders, Wishlist, Profile
 * - Seller: Products, Orders, Analytics
 * - Admin: Full access including users, settings, etc.
 */
function AdminSidebar({ pendingCount = 0 }) {
    const navigate = useNavigate()
    const { user, logout, isAdmin, isSeller } = useAuth()
    const { data: storeName } = useSetting('store_name')

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark flex flex-col z-20">
            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
                    <Icon name="storefront" size={28} />
                    <span>{storeName || 'TokoIndo'}</span>
                    {isAdmin && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full ml-2">Admin</span>}
                    {!isAdmin && isSeller && <span className="text-xs bg-blue-500/20 text-blue-600 px-2 py-0.5 rounded-full ml-2">Seller</span>}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-6">
                {/* User Menu - All roles */}
                <div>
                    <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menu Saya</h3>
                    <div className="space-y-1">
                        <AdminNavItem
                            to="/admin"
                            icon="dashboard"
                            label="Dashboard"
                        />
                        <AdminNavItem
                            to="/admin/orders"
                            icon="receipt_long"
                            label="Pesanan Saya"
                        />
                    </div>
                </div>

                {/* Seller Menu - Seller & Admin only */}
                {isSeller && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Penjualan</h3>
                        <div className="space-y-1">
                            <AdminNavItem
                                to="/admin/products"
                                icon="inventory_2"
                                label="Daftar Produk"
                            />
                            <AdminNavItem
                                to="/admin/categories"
                                icon="category"
                                label="Kategori"
                            />
                            <AdminNavItem
                                to="/admin/sales"
                                icon="point_of_sale"
                                label="Pesanan"
                                badge={pendingCount > 0 ? pendingCount : undefined}
                            />
                            <AdminNavItem
                                to="/admin/analytics"
                                icon="analytics"
                                label="Statistik"
                            />
                            <AdminNavItem
                                to="/admin/banners"
                                icon="image"
                                label="Banner"
                            />
                            <AdminNavItem
                                to="/admin/customers"
                                icon="people"
                                label="Daftar Customer"
                            />
                        </div>
                    </div>
                )}

                {/* Admin Menu - Admin only */}
                {isAdmin && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Administrasi</h3>
                        <div className="space-y-1">
                            <AdminNavItem
                                to="/admin/users"
                                icon="group"
                                label="Kelola Pengguna"
                            />
                            <AdminNavItem
                                to="/admin/coupons"
                                icon="confirmation_number"
                                label="Kupon"
                            />
                            <AdminNavItem
                                to="/admin/shipping"
                                icon="local_shipping"
                                label="Pengiriman"
                            />
                            <AdminNavItem
                                to="/admin/reviews"
                                icon="rate_review"
                                label="Ulasan"
                            />
                        </div>
                    </div>
                )}

                {/* System - Admin only */}
                {isAdmin && (
                    <div>
                        <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sistem</h3>
                        <div className="space-y-1">
                            <AdminNavItem
                                to="/admin/settings"
                                icon="settings"
                                label="Pengaturan Toko"
                            />
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
    )
}

export default AdminSidebar

