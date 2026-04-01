import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { paymentApi } from '../api/client'
import { Icon } from '../components/atoms'

function PaymentStatusPage() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [status, setStatus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [creatingSettlement, setCreatingSettlement] = useState(false)

    const fetchStatus = async () => {
        try {
            const res = await paymentApi.status(orderId)
            setStatus(res.data)
        } catch (err) {
            console.error('Failed to fetch payment status:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
        // Poll every 5 seconds for status updates
        const interval = setInterval(fetchStatus, 5000)
        return () => clearInterval(interval)
    }, [orderId])

    const getStatusDisplay = () => {
        if (!status) return { icon: 'hourglass_empty', color: 'text-slate-400', label: 'Memuat...', bg: 'bg-slate-50 dark:bg-slate-800' }

        if (status.hasServiceItems && status.serviceStatus === 'awaiting_settlement') {
            return { icon: 'account_balance_wallet', color: 'text-orange-500', label: 'Menunggu Pelunasan', bg: 'bg-orange-50 dark:bg-orange-900/20' }
        }

        const ps = status.paymentStatus
        if (ps === 'paid') return { icon: 'check_circle', color: 'text-green-500', label: 'Pembayaran Berhasil! ✅', bg: 'bg-green-50 dark:bg-green-900/20' }
        if (ps === 'dp_paid') return { icon: 'check_circle', color: 'text-purple-500', label: 'DP Berhasil Dibayar! ✅', bg: 'bg-purple-50 dark:bg-purple-900/20' }
        if (ps === 'expired') return { icon: 'cancel', color: 'text-red-500', label: 'Pembayaran Kedaluwarsa', bg: 'bg-red-50 dark:bg-red-900/20' }
        return { icon: 'pending', color: 'text-amber-500', label: 'Menunggu Pembayaran...', bg: 'bg-amber-50 dark:bg-amber-900/20' }
    }

    const handleCreateSettlement = async () => {
        setCreatingSettlement(true)
        try {
            const res = await paymentApi.create(orderId, status.paymentMethod, 'settlement')
            if (res.data?.paymentUrl) {
                window.location.href = res.data.paymentUrl
            } else {
                fetchStatus()
            }
        } catch (err) {
            console.error('Failed to create settlement invoice:', err)
            alert('Gagal membuat tagihan pelunasan. Coba ubah metode pembayaran di admin atau hubungi toko.')
        } finally {
            setCreatingSettlement(false)
        }
    }

    const display = getStatusDisplay()

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className={`${display.bg} p-8 text-center`}>
                    <Icon name={display.icon} size={64} className={`${display.color} mx-auto mb-4`} />
                    <h1 className={`text-2xl font-bold ${display.color}`}>{display.label}</h1>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-slate-500 mt-2">Mengecek status...</p>
                        </div>
                    ) : status ? (
                        <>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500">No. Order</span>
                                <span className="font-bold text-slate-900 dark:text-white">{status.orderNumber}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500">Nominal Tagihan Saat Ini</span>
                                <span className="font-bold text-primary">
                                    Rp {(status.serviceStatus === 'awaiting_settlement' 
                                            ? status.settlementAmount 
                                            : (status.hasServiceItems && status.serviceStatus === 'waiting_dp' ? status.dpAmount : status.total)
                                        )?.toLocaleString('id-ID')}
                                </span>
                            </div>
                            {status.hasServiceItems && (
                                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500">Total Harga Layanan</span>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Rp {status.total?.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500">Metode</span>
                                <span className="font-semibold text-slate-900 dark:text-white capitalize">{status.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700">
                                <span className="text-slate-500">Status Order</span>
                                <span className="font-semibold text-slate-900 dark:text-white capitalize">{status.orderStatus}</span>
                            </div>

                            {/* Retry payment if still pending */}
                            {(status.paymentStatus === 'unpaid' || status.paymentStatus === 'expired') && status.payment?.paymentUrl && status.paymentStatus !== 'paid' && status.paymentStatus !== 'dp_paid' && (
                                <a
                                    href={status.payment.paymentUrl}
                                    className="block w-full text-center py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors mt-4"
                                >
                                    Bayar Sekarang
                                </a>
                            )}

                            {/* Show create settlement button if status is awaiting_settlement but no pending invoice for settlement generated yet */}
                            {status.serviceStatus === 'awaiting_settlement' && (!status.payment || status.payment.status === 'paid' || status.payment.status === 'expired') && (
                                <button
                                    onClick={handleCreateSettlement}
                                    disabled={creatingSettlement}
                                    className="block w-full text-center py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors mt-4 disabled:opacity-50"
                                >
                                    {creatingSettlement ? 'Membuat Tagihan...' : 'Buat Tagihan Pelunasan'}
                                </button>
                            )}

                            {/* Show pending settlement invoice if generated */}
                            {status.serviceStatus === 'awaiting_settlement' && status.payment?.status === 'unpaid' && status.payment?.paymentUrl && (
                                <a
                                    href={status.payment.paymentUrl}
                                    className="block w-full text-center py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors mt-4"
                                >
                                    Bayar Pelunasan Sekarang
                                </a>
                            )}

                            {status.paymentStatus === 'paid' && !status.serviceStatus && (
                                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mt-4">
                                    <p className="text-green-700 dark:text-green-400 font-medium">
                                        🎉 Terima kasih! Pesanan Anda sedang diproses.
                                    </p>
                                </div>
                            )}

                            {status.paymentStatus === 'dp_paid' && status.serviceStatus === 'dp_paid' && (
                                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl mt-4">
                                    <p className="text-purple-700 dark:text-purple-400 font-medium">
                                        🎉 Pembayaran DP berhasil! Menunggu Admin memulai status pengerjaan produk jasa Anda.
                                    </p>
                                </div>
                            )}
                            
                            {status.serviceStatus === 'settled' && (
                                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mt-4">
                                    <p className="text-green-700 dark:text-green-400 font-medium">
                                        🎉 Pembayaran lunas! Layanan Jasa Anda telah selesai sepenuhnya.
                                    </p>
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-center text-slate-500">Data tidak ditemukan.</p>
                    )}

                    <button
                        onClick={() => navigate('/')}
                        className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                        Kembali ke Beranda
                    </button>
                </div>
            </div>
        </div>
    )
}

export default PaymentStatusPage
