import { useState } from 'react'
import { useAuth, useToast, useStore } from '../context'
import { useCourierDeliveries, useUpdateDeliveryStatus } from '../hooks'
import { Icon, Modal } from '../components/atoms'

/**
 * CourierDashboardPage - Mobile-first dashboard for store couriers
 * Mounted directly on /s/:slug/courier
 */
function CourierDashboardPage() {
    const { user, logout } = useAuth()
    const { storeSlug } = useStore()
    const toast = useToast()
    
    // Using a simpler approach: fetch all and filter in frontend
    const { data: deliveries = [], isLoading, refetch } = useCourierDeliveries()
    const updateDelivery = useUpdateDeliveryStatus()
    
    const [activeTab, setActiveTab] = useState('active') // 'active' or 'history'
    const [actionLoading, setActionLoading] = useState(null)
    
    // Modal state for confirming "Selesai"
    const [showCompleteModal, setShowCompleteModal] = useState(false)
    const [deliveryToAction, setDeliveryToAction] = useState(null)

    const handleLogout = async () => {
        await logout()
        window.location.href = `/s/${storeSlug}/login`
    }

    const activeStatuses = ['assigned', 'picked_up', 'on_the_way']
    
    const filteredDeliveries = deliveries.filter(d => 
        activeTab === 'active' 
            ? activeStatuses.includes(d.status)
            : !activeStatuses.includes(d.status)
    )

    const getStatusBadge = (status) => {
        switch (status) {
            case 'assigned': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold">Menunggu Diambil</span>
            case 'picked_up': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">Paket Dibawa</span>
            case 'on_the_way': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold">Sedang Diantar</span>
            case 'delivered': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold">Selesai</span>
            case 'failed': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold">Gagal</span>
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-bold">{status}</span>
        }
    }

    const handleUpdateStatus = async (id, newStatus) => {
        setActionLoading(id)
        try {
            await updateDelivery.mutateAsync({ id, status: newStatus })
            toast.success('Status pengantaran diperbarui')
            refetch?.()
        } catch (err) {
            toast.error(err.message || 'Gagal perbarui status')
        } finally {
            setActionLoading(null)
        }
    }

    const confirmComplete = async () => {
        if (!deliveryToAction) return
        setActionLoading(deliveryToAction.id)
        try {
            await updateDelivery.mutateAsync({ id: deliveryToAction.id, status: 'delivered' })
            toast.success('Pengantaran Selesai!')
            setShowCompleteModal(false)
            setDeliveryToAction(null)
            refetch?.()
        } catch (err) {
            toast.error(err.message || 'Gagal menyelesaikan')
        } finally {
            setActionLoading(null)
        }
    }

    const formatPhone = (phone) => {
        if (!phone) return ''
        return phone.replace(/\D/g, '')
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center text-slate-500">
                    <Icon name="local_shipping" size={48} className="animate-pulse mx-auto mb-4 opacity-50 text-primary" />
                    <p>Memuat tugas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-20">
            {/* Courier Header Wrapper */}
            <div className="bg-primary text-white shadow-md sticky top-0 z-10 rounded-b-2xl mb-4">
                <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Icon name="two_wheeler" size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{user?.name}</h1>
                            <p className="text-xs text-primary-light opacity-90">Kurir Internal</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title="Logout"
                    >
                        <Icon name="logout" size={24} />
                    </button>
                </div>
                
                {/* Stats summary */}
                <div className="px-4 pb-4">
                    <div className="bg-white/10 rounded-xl p-3 flex justify-around text-center backdrop-blur-sm">
                        <div onClick={() => setActiveTab('active')} className={`cursor-pointer ${activeTab === 'active' ? 'opacity-100 font-bold scale-105 transition-transform' : 'opacity-70'}`}>
                            <div className="text-2xl">{deliveries.filter(d => activeStatuses.includes(d.status)).length}</div>
                            <div className="text-xs uppercase tracking-wider">Tugas Aktif</div>
                        </div>
                        <div className="w-px bg-white/20"></div>
                        <div onClick={() => setActiveTab('history')} className={`cursor-pointer ${activeTab === 'history' ? 'opacity-100 font-bold scale-105 transition-transform' : 'opacity-70'}`}>
                            <div className="text-2xl">{deliveries.filter(d => !activeStatuses.includes(d.status)).length}</div>
                            <div className="text-xs uppercase tracking-wider">Riwayat</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="px-4 space-y-4">
                {filteredDeliveries.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <Icon name="check_circle" size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p className="text-slate-500 font-medium">Bagus! Tidak ada tugas saat ini.</p>
                        <p className="text-xs text-slate-400 mt-1">Tarik ke bawah untuk memuat ulang layar.</p>
                    </div>
                ) : (
                    filteredDeliveries.map(delivery => {
                        const order = delivery.orderData || {}
                        return (
                            <div key={delivery.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                {/* Card Header */}
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                        #{order?.orderNumber || order?.id?.slice(0,8)}
                                    </div>
                                    <div>{getStatusBadge(delivery.status)}</div>
                                </div>
                                
                                {/* Card Body */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 text-slate-400">
                                            <Icon name="person" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                                                {order.recipientName}
                                            </p>
                                            <a 
                                                href={`https://wa.me/${formatPhone(order.recipientPhone)}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-sm text-green-600 font-medium inline-flex items-center gap-1 mt-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg"
                                            >
                                                <Icon name="chat" size={14} /> Hubungi WhatsApp
                                            </a>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5 text-slate-400">
                                            <Icon name="location_on" size={20} />
                                        </div>
                                        <div className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                                            <p>{order.address}</p>
                                            <p className="text-slate-500 text-xs mt-0.5">{order.district}, {order.city}</p>
                                        </div>
                                    </div>

                                    {order.deliverySlot && (
                                        <div className="flex items-start gap-3 pt-2">
                                            <div className="mt-0.5 text-slate-400">
                                                <Icon name="schedule" size={20} />
                                            </div>
                                            <div className="flex-1 text-sm">
                                                <p className="font-medium text-emerald-700 dark:text-emerald-400">Jadwal Kirim</p>
                                                <p className="text-slate-700 dark:text-slate-300">{order.deliverySlot}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <div className="mt-0.5 text-slate-400">
                                            <Icon name="payments" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500">Total Tagihan Pemesan</p>
                                            <p className="font-bold text-primary text-base">Rp {(order.total || 0).toLocaleString('id-ID')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Actions */}
                                {activeTab === 'active' && (
                                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                                        {delivery.status === 'assigned' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(delivery.id, 'picked_up')}
                                                disabled={actionLoading === delivery.id}
                                                className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                Ambil Paket
                                            </button>
                                        )}
                                        {delivery.status === 'picked_up' && (
                                            <button 
                                                onClick={() => handleUpdateStatus(delivery.id, 'on_the_way')}
                                                disabled={actionLoading === delivery.id}
                                                className="flex-1 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                                            >
                                                Mulai Antar Ke Tujuan
                                            </button>
                                        )}
                                        {delivery.status === 'on_the_way' && (
                                            <button 
                                                onClick={() => {
                                                    setDeliveryToAction(delivery)
                                                    setShowCompleteModal(true)
                                                }}
                                                disabled={actionLoading === delivery.id}
                                                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                <Icon name="check_circle" size={18} /> Paket Diserahkan
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Complete Delivery Modal */}
            <Modal
                isOpen={showCompleteModal}
                onClose={() => { setShowCompleteModal(false); setDeliveryToAction(null) }}
                title="Selesaikan Pengantaran"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="where_to_vote" size={32} className="text-green-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                        Paket telah diserahkan sepenuhnya kepada <strong>{deliveryToAction?.orderData?.recipientName}</strong>?
                    </p>
                    <p className="text-sm text-slate-500">
                        Status pesanan akan diubah menjadi "Selesai" dan notifikasi akan dikirim ke Server Toko.
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => { setShowCompleteModal(false); setDeliveryToAction(null) }}
                        disabled={actionLoading === deliveryToAction?.id}
                        className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={confirmComplete}
                        disabled={actionLoading === deliveryToAction?.id}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {actionLoading === deliveryToAction?.id ? 'Memproses...' : 'Ya, Selesai!'}
                    </button>
                </div>
            </Modal>
        </div>
    )
}

export default CourierDashboardPage
