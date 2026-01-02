import { useState } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import StatCard from '../components/molecules/StatCard'
import { Icon } from '../components/atoms'
import { useAuth } from '../context'
import { useOrders, useProducts, useSetting } from '../hooks'

/**
 * AdminDashboardPage - Main dashboard with role-based content
 */
function AdminDashboardPage() {
    const { user, isAdmin, isSeller } = useAuth()
    const { data: storeName } = useSetting('store_name')

    // Fetch data from API with safe access
    const ordersQuery = useOrders()
    const productsQuery = useProducts()

    const ordersData = ordersQuery?.data
    const productsData = productsQuery?.data
    const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || [])
    const products = Array.isArray(productsData) ? productsData : (productsData?.products || productsData?.data || [])

    // Calculate stats with safe array access
    const pendingOrders = orders.filter(o => o?.status === 'pending').length
    const completedOrders = orders.filter(o => o?.status === 'completed' || o?.status === 'delivered').length
    const totalRevenue = orders
        .filter(o => o?.status === 'delivered')
        .reduce((sum, o) => sum + (o?.total || 0), 0)

    // Format currency
    const formatPrice = (price) => {
        if (price >= 1000000) return `Rp ${(price / 1000000).toFixed(1)}jt`
        if (price >= 1000) return `Rp ${(price / 1000).toFixed(0)}rb`
        return `Rp ${price.toLocaleString('id-ID')}`
    }

    return (
        <>
            <AdminHeader
                title={`Selamat Datang di ${storeName || 'TokoIndo'}!`}
                subtitle={isAdmin ? 'Admin Dashboard' : isSeller ? 'Seller Dashboard' : 'Dashboard Saya'}
            />

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Pesanan Pending"
                        value={pendingOrders.toString()}
                        icon="pending_actions"
                        color="orange"
                    />
                    <StatCard
                        title="Pesanan Selesai"
                        value={completedOrders.toString()}
                        icon="check_circle"
                        color="green"
                    />
                    {isSeller && (
                        <StatCard
                            title="Total Produk"
                            value={products.length.toString()}
                            icon="inventory_2"
                            color="blue"
                        />
                    )}
                    {isSeller && (
                        <StatCard
                            title="Pendapatan"
                            value={formatPrice(totalRevenue)}
                            icon="payments"
                            color="purple"
                        />
                    )}
                </div>

                {/* Recent Orders */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                            Pesanan Terbaru
                        </h3>
                        <a href="/admin/orders" className="text-sm text-primary hover:underline">
                            Lihat Semua →
                        </a>
                    </div>

                    {orders.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Icon name="receipt_long" size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Belum ada pesanan</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {orders.slice(0, 5).map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                            #{order.orderNumber || order.id?.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {order.guestName || order.recipientName || 'Guest'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-primary">
                                            Rp {(order.total || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status || 'pending'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {isSeller && (
                        <a href="/admin/products" className="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                <Icon name="add_box" size={24} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Tambah Produk</p>
                                <p className="text-sm text-slate-500">Kelola katalog produk</p>
                            </div>
                        </a>
                    )}
                    <a href="/admin/orders" className="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600">
                            <Icon name="receipt_long" size={24} />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">Lihat Pesanan</p>
                            <p className="text-sm text-slate-500">Cek status pesanan</p>
                        </div>
                    </a>
                    {isAdmin && (
                        <a href="/admin/settings" className="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600">
                                <Icon name="settings" size={24} />
                            </div>
                            <div>
                                <p className="font-semibold text-slate-900 dark:text-white">Pengaturan</p>
                                <p className="text-sm text-slate-500">Konfigurasi toko</p>
                            </div>
                        </a>
                    )}
                </div>
            </div>
        </>
    )
}

export default AdminDashboardPage

