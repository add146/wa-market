import { useState } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import { useOrders } from '../hooks'
import { ordersApi } from '../api/client'
import { useAuth, useToast } from '../context'

/**
 * AdminOrdersPage - Order list with approve/delete actions (admin only)
 */
function AdminOrdersPage() {
    const { isAdmin } = useAuth()
    const ordersQuery = useOrders()
    const isLoading = ordersQuery?.isLoading ?? true
    const ordersData = ordersQuery?.data
    const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || [])
    const refetch = ordersQuery?.refetch

    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)

    // Confirmation modals state
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [orderToAction, setOrderToAction] = useState(null)

    const toast = useToast()

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o?.status === statusFilter)

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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

    // Open approve confirmation modal
    const openApproveModal = (order) => {
        setOrderToAction(order)
        setShowApproveModal(true)
    }

    // Confirm approve action
    const confirmApprove = async () => {
        if (!orderToAction) return
        setActionLoading(orderToAction.id)
        try {
            await ordersApi.approve(orderToAction.id)
            toast.success('Pesanan berhasil disetujui!')
            setShowApproveModal(false)
            setOrderToAction(null)
            refetch?.()
        } catch (error) {
            toast.error('Gagal menyetujui pesanan: ' + (error.message || 'Unknown error'))
        } finally {
            setActionLoading(null)
        }
    }

    // Open delete confirmation modal
    const openDeleteModal = (order) => {
        setOrderToAction(order)
        setShowDeleteModal(true)
    }

    // Confirm delete action
    const confirmDelete = async () => {
        if (!orderToAction) return
        setActionLoading(orderToAction.id)
        try {
            await ordersApi.delete(orderToAction.id)
            toast.success('Pesanan berhasil dihapus!')
            setShowDeleteModal(false)
            setOrderToAction(null)
            refetch?.()
        } catch (error) {
            toast.error('Gagal menghapus pesanan: ' + (error.message || 'Unknown error'))
        } finally {
            setActionLoading(null)
        }
    }

    const openDetail = (order) => {
        setSelectedOrder(order)
        setShowDetailModal(true)
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatPhone = (phone) => {
        if (!phone) return '-'
        // Format: +62 812-3456-7890
        const clean = phone.replace(/\D/g, '')
        if (clean.length > 10) {
            return `+${clean.slice(0, 2)} ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`
        }
        return phone
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
                    {['all', 'pending', 'approved', 'shipped', 'completed', 'cancelled'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                ? 'bg-primary text-white'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                }`}
                        >
                            {status === 'all' ? 'Semua' : getStatusLabel(status)}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Icon name="receipt_long" size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Tidak ada pesanan</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredOrders.map(order => (
                                <div key={order.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Left: Order Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    #{order.orderNumber || order.id?.slice(0, 8)}
                                                </span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusLabel(order.status)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-slate-700 dark:text-slate-300 font-medium">
                                                    {order.recipientName || 'Guest'}
                                                </span>
                                                <a
                                                    href={`https://wa.me/${(order.recipientPhone || order.guestPhone || '').replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:text-green-700 flex items-center gap-1"
                                                >
                                                    <Icon name="chat" size={14} />
                                                    {formatPhone(order.recipientPhone || order.guestPhone)}
                                                </a>
                                                <span className="text-slate-500">
                                                    {formatDate(order.createdAt)}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-sm font-semibold text-primary">
                                                Rp {(order.total || 0).toLocaleString('id-ID')}
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => openDetail(order)}
                                                className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary border border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary transition-colors"
                                            >
                                                <Icon name="visibility" size={16} className="mr-1" />
                                                Detail
                                            </button>

                                            {isAdmin && order.status === 'pending' && (
                                                <button
                                                    onClick={() => openApproveModal(order)}
                                                    disabled={actionLoading === order.id}
                                                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === order.id ? '...' : (
                                                        <>
                                                            <Icon name="check" size={16} className="mr-1" />
                                                            Approve
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {isAdmin && (
                                                <button
                                                    onClick={() => openDeleteModal(order)}
                                                    disabled={actionLoading === order.id}
                                                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === order.id ? '...' : (
                                                        <>
                                                            <Icon name="delete" size={16} className="mr-1" />
                                                            Hapus
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <Modal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                title={`Detail Pesanan #${selectedOrder?.orderNumber || selectedOrder?.id?.slice(0, 8)}`}
                size="lg"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        {/* Order Info */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">No. Order:</span>
                                    <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.orderNumber}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Status:</span>
                                    <p className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                        {getStatusLabel(selectedOrder.status)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Tanggal:</span>
                                    <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedOrder.createdAt)}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Total:</span>
                                    <p className="font-bold text-primary">Rp {(selectedOrder.total || 0).toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">👤 Data Penerima</h4>
                            <div className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                                <p><strong>Nama:</strong> {selectedOrder.recipientName}</p>
                                <p>
                                    <strong>WhatsApp:</strong>{' '}
                                    <a
                                        href={`https://wa.me/${(selectedOrder.recipientPhone || '').replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:underline"
                                    >
                                        {selectedOrder.recipientPhone}
                                    </a>
                                </p>
                                <p><strong>Alamat:</strong> {selectedOrder.address}</p>
                                <p><strong>Kecamatan:</strong> {selectedOrder.district}</p>
                                <p><strong>Kota:</strong> {selectedOrder.city}</p>
                                <p><strong>Provinsi:</strong> {selectedOrder.province}</p>
                            </div>
                        </div>

                        {/* Shipping Info */}
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">🚚 Pengiriman</h4>
                            <div className="text-sm space-y-1 text-slate-700 dark:text-slate-300">
                                <p><strong>Kurir:</strong> {selectedOrder.courierName}</p>
                                <p><strong>Ongkir:</strong> Rp {(selectedOrder.shippingCost || 0).toLocaleString('id-ID')}</p>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="border-t dark:border-slate-700 pt-4">
                            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">💰 Rincian Pembayaran</h4>
                            <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Subtotal:</span>
                                    <span className="text-slate-900 dark:text-white">Rp {(selectedOrder.subtotal || 0).toLocaleString('id-ID')}</span>
                                </div>
                                {selectedOrder.couponCode && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Kupon ({selectedOrder.couponCode}):</span>
                                        <span>-Rp {(selectedOrder.couponDiscount || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Ongkir:</span>
                                    <span className="text-slate-900 dark:text-white">+Rp {(selectedOrder.shippingCost || 0).toLocaleString('id-ID')}</span>
                                </div>
                                {selectedOrder.uniqueCode > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Kode Unik:</span>
                                        <span className="text-slate-900 dark:text-white">+Rp {selectedOrder.uniqueCode}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-lg pt-2 border-t dark:border-slate-700">
                                    <span className="text-slate-900 dark:text-white">TOTAL:</span>
                                    <span className="text-primary">Rp {(selectedOrder.total || 0).toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal
                isOpen={showApproveModal}
                onClose={() => { setShowApproveModal(false); setOrderToAction(null) }}
                title="Setujui Pesanan"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="check_circle" size={32} className="text-green-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                        Setujui pesanan <strong>#{orderToAction?.orderNumber || orderToAction?.id?.slice(0, 8)}</strong>?
                    </p>
                    <p className="text-sm text-slate-500">
                        Pesanan akan diproses dan customer akan mendapat notifikasi.
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => { setShowApproveModal(false); setOrderToAction(null) }}
                        disabled={actionLoading}
                        className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={confirmApprove}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? 'Menyetujui...' : 'Setujui'}
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setOrderToAction(null) }}
                title="Hapus Pesanan"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="delete" size={32} className="text-red-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                        Yakin ingin menghapus pesanan <strong>#{orderToAction?.orderNumber || orderToAction?.id?.slice(0, 8)}</strong>?
                    </p>
                    <p className="text-sm text-slate-500">
                        Data pesanan tidak dapat dikembalikan.
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => { setShowDeleteModal(false); setOrderToAction(null) }}
                        disabled={actionLoading}
                        className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={confirmDelete}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? 'Menghapus...' : 'Hapus'}
                    </button>
                </div>
            </Modal>
        </>
    )
}

export default AdminOrdersPage
