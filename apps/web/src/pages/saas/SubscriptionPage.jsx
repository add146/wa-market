import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

function SubscriptionPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const callbackStatus = searchParams.get('status')

    const [storeSlug, setStoreSlug] = useState('')
    const [storeId, setStoreId] = useState('')
    const [subData, setSubData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedPlan, setSelectedPlan] = useState('starter')
    const [selectedProvider, setSelectedProvider] = useState('manual')
    const [isCreating, setIsCreating] = useState(false)

    // Check subscription status when storeId is available
    const fetchSubscriptionStatus = async (id) => {
        try {
            const res = await axios.get(`${API_BASE}/subscription/status/${id}`)
            setSubData(res.data)
        } catch (err) {
            console.error('Failed to fetch sub status:', err)
        }
    }

    const handleLookupStore = async () => {
        if (!storeSlug.trim()) return
        setLoading(true)
        setError('')
        try {
            const res = await axios.get(`${API_BASE}/stores/${storeSlug.trim()}`)
            if (res.data?.id) {
                setStoreId(res.data.id)
                await fetchSubscriptionStatus(res.data.id)
            } else {
                setError('Toko tidak ditemukan')
            }
        } catch (err) {
            setError('Toko tidak ditemukan. Periksa slug toko Anda.')
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async () => {
        if (!storeId) return
        setIsCreating(true)
        setError('')
        try {
            const token = localStorage.getItem('auth_token')
            const res = await axios.post(`${API_BASE}/subscription/create`, {
                storeId,
                plan: selectedPlan,
                provider: selectedProvider,
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            })

            const data = res.data
            if (data.paymentUrl) {
                window.location.href = data.paymentUrl
            } else if (data.message) {
                alert(data.message)
                await fetchSubscriptionStatus(storeId)
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Gagal membuat subscription')
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Header */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                <button
                    onClick={() => navigate('/')}
                    className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1 mb-8"
                >
                    ← Kembali ke Beranda
                </button>

                <h1 className="text-3xl font-extrabold mb-2">🚀 Upgrade Toko Anda</h1>
                <p className="text-slate-400 max-w-xl">
                    Berlangganan paket berbayar untuk membuka fitur premium dan meningkatkan penjualan toko Anda.
                </p>

                {/* Callback status */}
                {callbackStatus === 'success' && (
                    <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
                        <p className="text-green-400 font-semibold">✅ Pembayaran berhasil! Paket toko Anda akan segera diperbarui.</p>
                    </div>
                )}
                {callbackStatus === 'failed' && (
                    <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                        <p className="text-red-400 font-semibold">❌ Pembayaran gagal. Silakan coba lagi.</p>
                    </div>
                )}
            </div>

            <div className="max-w-4xl mx-auto px-6 pb-16">
                {/* Store Lookup */}
                {!storeId ? (
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 max-w-lg">
                        <h2 className="text-xl font-bold mb-4">Masukkan Slug Toko</h2>
                        <p className="text-sm text-slate-400 mb-4">Masukkan slug toko yang ingin di-upgrade (contoh: toko-makmur).</p>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={storeSlug}
                                onChange={(e) => setStoreSlug(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLookupStore()}
                                placeholder="slug-toko-anda"
                                className="flex-1 px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                onClick={handleLookupStore}
                                disabled={loading}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? '...' : 'Cari'}
                            </button>
                        </div>
                        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
                    </div>
                ) : (
                    <>
                        {/* Current Status */}
                        {subData && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
                                <h2 className="text-lg font-bold mb-3">📊 Status Toko: {subData.storeName}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                                        <p className="text-xs text-slate-400">Paket Saat Ini</p>
                                        <p className="text-xl font-bold text-blue-400 capitalize">{subData.currentPlan}</p>
                                    </div>
                                    <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                                        <p className="text-xs text-slate-400">Harga</p>
                                        <p className="text-xl font-bold text-green-400">Rp {subData.price?.toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                                        <p className="text-xs text-slate-400">Status Langganan</p>
                                        <p className={`text-xl font-bold ${subData.activeSubscription ? 'text-green-400' : 'text-slate-400'}`}>
                                            {subData.activeSubscription ? 'Aktif ✅' : 'Tidak Aktif'}
                                        </p>
                                    </div>
                                    {subData.activeSubscription?.periodEnd && (
                                        <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                                            <p className="text-xs text-slate-400">Berlaku Sampai</p>
                                            <p className="text-base font-bold text-amber-400">
                                                {new Date(subData.activeSubscription.periodEnd).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Plan Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Free */}
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                                <div className="text-center mb-4">
                                    <span className="text-3xl">🆓</span>
                                    <h3 className="text-xl font-bold mt-2">Free</h3>
                                    <p className="text-2xl font-extrabold text-slate-400 mt-1">Gratis</p>
                                </div>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li>✓ 20 Produk</li>
                                    <li>✓ WhatsApp Checkout</li>
                                    <li>✓ Kupon & Banner</li>
                                    <li>✗ Payment Gateway</li>
                                    <li>✗ Custom Domain</li>
                                </ul>
                                {subData?.currentPlan === 'free' && (
                                    <p className="mt-4 text-center text-sm text-green-400 font-semibold">Paket Saat Ini</p>
                                )}
                            </div>

                            {/* Starter */}
                            <div
                                className={`rounded-2xl p-6 cursor-pointer transition-all border-2 ${
                                    selectedPlan === 'starter'
                                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30'
                                        : 'border-slate-700/50 bg-slate-800/50 hover:border-blue-500/50'
                                }`}
                                onClick={() => setSelectedPlan('starter')}
                            >
                                <div className="text-center mb-4">
                                    <span className="text-3xl">🚀</span>
                                    <h3 className="text-xl font-bold mt-2 text-blue-400">Starter</h3>
                                    <p className="text-2xl font-extrabold text-white mt-1">Rp 300.000<span className="text-sm text-slate-400">/tahun</span></p>
                                </div>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    <li>✓ 100 Produk</li>
                                    <li>✓ Payment Gateway</li>
                                    <li>✓ Custom Domain</li>
                                    <li>✓ Analitik Dasar</li>
                                    <li>✓ WAHA Gateway</li>
                                </ul>
                            </div>

                            {/* Pro */}
                            <div
                                className={`rounded-2xl p-6 cursor-pointer transition-all border-2 ${
                                    selectedPlan === 'pro'
                                        ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                                        : 'border-slate-700/50 bg-slate-800/50 hover:border-amber-500/50'
                                }`}
                                onClick={() => setSelectedPlan('pro')}
                            >
                                <div className="text-center mb-4">
                                    <span className="text-3xl">👑</span>
                                    <h3 className="text-xl font-bold mt-2 text-amber-400">Pro</h3>
                                    <p className="text-2xl font-extrabold text-white mt-1">Rp 300.000<span className="text-sm text-slate-400">/tahun</span></p>
                                </div>
                                <ul className="space-y-2 text-sm text-slate-300">
                                    <li>✓ Unlimited Produk</li>
                                    <li>✓ Semua fitur Starter</li>
                                    <li>✓ Kurir Internal</li>
                                    <li>✓ Multi User/Admin</li>
                                    <li>✓ Prioritas Support</li>
                                </ul>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
                            <h2 className="text-lg font-bold mb-4">💳 Metode Pembayaran</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    { value: 'manual', label: 'WhatsApp (Manual)', desc: 'Transfer & kirim bukti ke admin', icon: '💬' },
                                    { value: 'xendit', label: 'Xendit', desc: 'Transfer, QRIS, E-Wallet', icon: '💳' },
                                    { value: 'midtrans', label: 'Midtrans', desc: 'Transfer, GoPay, ShopeePay', icon: '💳' },
                                ].map((method) => (
                                    <button
                                        key={method.value}
                                        onClick={() => setSelectedProvider(method.value)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                                            selectedProvider === method.value
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-slate-600 hover:border-blue-500/50'
                                        }`}
                                    >
                                        <span className="text-xl">{method.icon}</span>
                                        <p className="font-semibold text-white mt-1">{method.label}</p>
                                        <p className="text-xs text-slate-400">{method.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subscribe Button */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSubscribe}
                            disabled={isCreating || !selectedPlan || selectedPlan === 'free'}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                        >
                            {isCreating ? 'Memproses...' : `Berlangganan ${selectedPlan?.toUpperCase()} — Rp 300.000/tahun`}
                        </button>

                        {/* Change store button */}
                        <button
                            onClick={() => { setStoreId(''); setSubData(null); setStoreSlug('') }}
                            className="block mx-auto mt-4 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Ganti Toko
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default SubscriptionPage
