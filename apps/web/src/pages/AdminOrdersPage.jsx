import { useState } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon } from '../components/atoms'
import { useOrders } from '../hooks'
import { useAuth } from '../context'

/**
 * AdminOrdersPage - Order list for users/sellers/admins
 */
function AdminOrdersPage() {
    const { isAdmin } = useAuth()
    const ordersQuery = useOrders()
    const isLoading = ordersQuery?.isLoading ?? true
    const ordersData = ordersQuery?.data
    const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.data || [])

    const [statusFilter, setStatusFilter] = useState('all')

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o?.status === statusFilter)

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'processing': return 'bg-blue-100 text-blue-800'
            case 'shipped': return 'bg-purple-100 text-purple-800'
            case 'delivered': return 'bg-green-100 text-green-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <>
            <AdminHeader
                title="Daftar Pesanan"
                subtitle={`${orders.length} total pesanan`}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Filters */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                        >
                            {status === 'all' ? 'Semua' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Orders Table */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Icon name="receipt_long" size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Tidak ada pesanan</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                            #{order.id?.slice(0, 8)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900 dark:text-white">
                                                {order.recipientName || order.guestName || 'Guest'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {order.recipientPhone || order.guestPhone || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-primary">
                                            Rp {(order.total || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status || 'pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary hover:text-primary-dark text-sm font-medium">
                                                Detail
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    )
}

export default AdminOrdersPage
