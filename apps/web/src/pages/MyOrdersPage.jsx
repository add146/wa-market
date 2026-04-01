import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Modal } from '../components/atoms'
import MobileNav from '../components/organisms/MobileNav'
import { useAuth } from '../context'
import api from '../api/client'
import { formatDateTimeWIB } from '../utils/dateWIB'

/**
 * MyOrdersPage - Customer view of their own orders (read-only)
 */
function MyOrdersPage() {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await api.get('/orders')
                setOrders(response.data?.orders || [])
            } catch (err) {
                console.error('Failed to fetch orders:', err)
            } finally {
                setIsLoading(false)
            }
        }
        if (user) fetchOrders()
    }, [user])

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800'
            case 'approved': return 'bg-green-100 text-green-800'
            case 'shipped': return 'bg-purple-100 text-purple-800'
            case 'completed': return 'bg-blue-100 text-blue-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending': return 'Menunggu'
            case 'approved': return 'Disetujui'
            case 'shipped': return 'Dikirim'
            case 'completed': return 'Selesai'
            case 'cancelled': return 'Dibatalkan'
            default: return status
        }
    }

    const getServiceStatusColor = (status) => {
        switch (status) {
            case 'waiting_dp': return 'bg-yellow-100 text-yellow-800'
            case 'dp_paid': return 'bg-blue-100 text-blue-800'
            case 'in_progress': return 'bg-purple-100 text-purple-800'
            case 'awaiting_settlement': return 'bg-orange-100 text-orange-800'
            case 'settled': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getServiceStatusLabel = (status) => {
        switch (status) {
            case 'waiting_dp': return 'Menunggu DP'
            case 'dp_paid': return 'DP Terbayar'
            case 'in_progress': return 'Dikerjakan'
            case 'awaiting_settlement': return 'Menunggu Pelunasan'
            case 'settled': return 'Lunas'
            default: return status
        }
    }

    const formatDate = (date) => formatDateTimeWIB(date)

    const openDetail = (order) => {
        setSelectedOrder(order)
        setShowDetailModal(true)
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <Icon name="login" size={64} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Silakan login untuk melihat pesanan</p>
                    <Link to="/login" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                        Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-color dark:border-surface-dark px-4 sm:px-8 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-text-main-light dark:text-white hover:text-primary transition-colors">
                        <Icon name="arrow_back" size={24} />
                        <span className="font-medium">Kembali</span>
                    </Link>
                    <h1 className="text-xl font-bold text-text-main-light dark:text-white">
                        Pesanan Saya
                    </h1>
                    <div className="w-20" />
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">Loading...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                        <Icon name="receipt_long" size={64} className="text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Belum ada pesanan</p>
                        <Link to="/" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4 relative">
                                {order.hasServiceItems && (
                                    <span className="absolute -top-3 left-4 px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded shadow-sm text-[10px] font-bold">
                                        🛠️ Jasa
                                    </span>
                                )}
                                <div className="flex items-start justify-between mb-3 mt-1">
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            #{order.orderNumber || order.id?.slice(0, 8)}
                                        </p>
                                        <p className="text-sm text-slate-500">{formatDate(order.createdAt)}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>
                                
                                {order.hasServiceItems && order.serviceStatus && (
                                    <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg flex items-center justify-between border border-purple-100 dark:border-purple-800/50">
                                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Status Pekerjaan:</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getServiceStatusColor(order.serviceStatus)}`}>
                                            {getServiceStatusLabel(order.serviceStatus)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {order.courierName || 'Kurir belum dipilih'}
                                        </p>
                                        <p className="text-lg font-bold text-primary">
                                            Rp {(order.total || 0).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openDetail(order)}
                                        className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
                                    >
                                        Lihat Detail
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

        {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Detail Pesanan #${selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 8)}`}
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500">Status</p>
                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                    {getStatusLabel(selectedOrder.status)}
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-500">Tanggal</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedOrder.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">Penerima</p>
                                <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.recipientName}</p>
                            </div>
                            <div>
                                <p className="text-slate-500">No. HP</p>
                                <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.recipientPhone}</p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <p className="text-slate-500 text-sm mb-1">Alamat Pengiriman</p>
                            <p className="font-medium text-slate-900 dark:text-white">
                                {selectedOrder.address}, {selectedOrder.district}, {selectedOrder.city}, {selectedOrder.province}
                            </p>
                        </div>

                        <div className="border-t pt-4">
                            <p className="text-slate-500 text-sm mb-1">Kurir / Metode</p>
                            <p className="font-medium text-slate-900 dark:text-white">{selectedOrder.courierName || '-'}</p>
                            {selectedOrder.shippingType === 'own_courier' && selectedOrder.deliverySlot && (
                                <p className="text-sm mt-1">
                                    <span className="text-slate-500">Jadwal Kirim: </span>
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{selectedOrder.deliverySlot}</span>
                                </p>
                            )}
                        </div>

                        {selectedOrder.hasServiceItems && (
                            <div className="border-t pt-4">
                                <p className="text-slate-500 text-sm mb-2 font-bold flex items-center gap-1">
                                    <Icon name="construction" size={16} /> Progress Jasa
                                </p>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800/50">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-purple-700 dark:text-purple-300">Status:</span>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getServiceStatusColor(selectedOrder.serviceStatus)}`}>
                                            {getServiceStatusLabel(selectedOrder.serviceStatus)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2 text-sm">
                                        <span className="text-slate-500">DP Dibayar:</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">Rp {(selectedOrder.dpAmount || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-3 text-sm border-b border-purple-200 dark:border-purple-700 pb-2">
                                        <span className="text-slate-500">Tagihan Pelunasan:</span>
                                        <span className="font-semibold text-orange-600 dark:text-orange-400">Rp {(selectedOrder.settlementAmount || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                    {selectedOrder.serviceNotes && (
                                        <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-2 rounded whitespace-pre-wrap text-xs">
                                            {selectedOrder.serviceNotes}
                                        </div>
                                    )}
                                    {selectedOrder.serviceStatus === 'awaiting_settlement' && (
                                        <Link to={`/payment-status/${selectedOrder.id}`} className="mt-3 flex justify-center py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold transition-colors">
                                            Bayar Pelunasan Sekarang
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span>Rp {(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Ongkir</span>
                                <span>Rp {(selectedOrder.shippingCost || 0).toLocaleString('id-ID')}</span>
                            </div>
                            {selectedOrder.couponDiscount > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Diskon Kupon</span>
                                    <span>-Rp {selectedOrder.couponDiscount.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            {selectedOrder.uniqueCode > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Kode Unik</span>
                                    <span>{selectedOrder.uniqueCode}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                <span>Total</span>
                                <span className="text-primary">Rp {(selectedOrder.total || 0).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <MobileNav />
        </div>
    )
}

export default MyOrdersPage
