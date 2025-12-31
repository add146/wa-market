import AdminHeader from '../components/organisms/AdminHeader'
import StatCard from '../components/molecules/StatCard'
import { Icon } from '../components/atoms'
import { useOrders, useProducts } from '../hooks'
import { useAuth } from '../context'

/**
 * AdminAnalyticsPage - Statistics and analytics for sellers/admins
 */
function AdminAnalyticsPage() {
    const { isSeller } = useAuth()
    const ordersQuery = useOrders()
    const productsQuery = useProducts()

    const ordersData = ordersQuery?.data
    const productsData = productsQuery?.data
    const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.data || [])
    const products = Array.isArray(productsData) ? productsData : (productsData?.products || productsData?.data || [])

    // Calculate stats with safe array access
    const totalOrders = orders.length
    const pendingOrders = orders.filter(o => o?.status === 'pending').length
    const completedOrders = orders.filter(o => o?.status === 'delivered').length
    const totalRevenue = orders
        .filter(o => o?.status === 'delivered')
        .reduce((sum, o) => sum + (o?.total || 0), 0)
    const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0

    // Format currency
    const formatPrice = (price) => {
        if (price >= 1000000) return `Rp ${(price / 1000000).toFixed(1)}jt`
        if (price >= 1000) return `Rp ${(price / 1000).toFixed(0)}rb`
        return `Rp ${price.toLocaleString('id-ID')}`
    }

    return (
        <>
            <AdminHeader
                title="Statistik & Analitik"
                subtitle="Ringkasan performa toko Anda"
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Total Pesanan"
                        value={totalOrders.toString()}
                        icon="receipt_long"
                        color="blue"
                    />
                    <StatCard
                        title="Pesanan Selesai"
                        value={completedOrders.toString()}
                        icon="check_circle"
                        color="green"
                    />
                    <StatCard
                        title="Total Pendapatan"
                        value={formatPrice(totalRevenue)}
                        icon="payments"
                        color="purple"
                    />
                    <StatCard
                        title="Rata-rata Order"
                        value={formatPrice(avgOrderValue)}
                        icon="trending_up"
                        color="orange"
                    />
                </div>

                {/* Product Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Icon name="inventory_2" size={20} />
                            Statistik Produk
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Total Produk</span>
                                <span className="font-bold text-slate-900 dark:text-white">{products.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Stok Habis</span>
                                <span className="font-bold text-red-500">
                                    {products.filter(p => (p.stock || 0) === 0).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Stok Rendah (&lt;10)</span>
                                <span className="font-bold text-orange-500">
                                    {products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10).length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Icon name="shopping_cart" size={20} />
                            Statistik Pesanan
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Pending</span>
                                <span className="font-bold text-yellow-600">{pendingOrders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Processing</span>
                                <span className="font-bold text-blue-500">
                                    {orders.filter(o => o?.status === 'processing').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Shipped</span>
                                <span className="font-bold text-purple-500">
                                    {orders.filter(o => o?.status === 'shipped').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 dark:text-slate-400">Delivered</span>
                                <span className="font-bold text-green-500">{completedOrders}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coming Soon Charts */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                    <Icon name="bar_chart" size={64} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2">Grafik & Chart</h3>
                    <p className="text-slate-500">Fitur grafik akan segera hadir</p>
                </div>
            </div>
        </>
    )
}

export default AdminAnalyticsPage
