import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon, Modal } from '../../components/atoms'
import {
    useSuperadminSession,
    useSuperadminLogout,
    usePlatformStats,
    useGetAllStores,
    useUpdateStorePlan,
    useUpdateStoreDomain,
    useToggleStore,
    useDeleteStore,
} from '../../hooks'
import axios from 'axios'

const SA_API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// ─── Plan Config ─────────────────────
const PLAN_CONFIG = {
    free:    { label: 'Free',    color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', icon: '🆓' },
    starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: '🚀' },
    pro:     { label: 'Pro',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: '👑' },
}

const PLAN_FEATURES = [
    { feature: 'Maksimal Produk',      free: '50',   starter: '500',  pro: 'Unlimited' },
    { feature: 'Kurir Internal',       free: '❌',   starter: '✅',   pro: '✅' },
    { feature: 'Notifikasi WAHA',      free: '❌',   starter: '❌',   pro: '✅' },
    { feature: 'Custom Domain',        free: '❌',   starter: '❌',   pro: '✅' },
    { feature: 'Analytics Dashboard',  free: 'Basic', starter: 'Full', pro: 'Full' },
    { feature: 'Prioritas Support',    free: '❌',   starter: '❌',   pro: '✅' },
]

function formatCurrency(n) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0)
}

// ─── Stat Card ───────────────────────
function StatCard({ icon, label, value, color = 'blue', sub }) {
    const colors = {
        blue:   'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        green:  'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        amber:  'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        rose:   'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    }
    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
                <Icon name={icon} size={28} />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase">{label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
function SuperAdminPage() {
    const navigate = useNavigate()
    const { data: session, isLoading: sessionLoading, isError } = useSuperadminSession()
    const logoutMutation = useSuperadminLogout()
    const { data: stats, isLoading: statsLoading } = usePlatformStats()
    const { data: stores = [], isLoading: storesLoading } = useGetAllStores()
    const updatePlan = useUpdateStorePlan()
    const updateDomain = useUpdateStoreDomain()
    const toggleStore = useToggleStore()
    const deleteStore = useDeleteStore()

    const [activeTab, setActiveTab] = useState('overview')
    const [planModal, setPlanModal] = useState(null) // { storeId, storeName, currentPlan }
    const [domainModal, setDomainModal] = useState(null) // { storeId, storeName, currentDomain }
    const [deleteModal, setDeleteModal] = useState(null) // { storeId, storeName }
    const [selectedPlan, setSelectedPlan] = useState('free')
    const [customDomainInput, setCustomDomainInput] = useState('')
    const [filterPlan, setFilterPlan] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [allSubscriptions, setAllSubscriptions] = useState([])
    const [subsLoading, setSubsLoading] = useState(false)

    // Fetch all subscriptions when tab is active
    useEffect(() => {
        if (activeTab === 'subscriptions') {
            const fetchSubs = async () => {
                setSubsLoading(true)
                try {
                    const token = localStorage.getItem('sa_token')
                    const res = await axios.get(`${SA_API}/superadmin/subscriptions`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    setAllSubscriptions(res.data || [])
                } catch (err) {
                    console.error('Failed to fetch subscriptions:', err)
                } finally {
                    setSubsLoading(false)
                }
            }
            fetchSubs()
        }
    }, [activeTab])

    // Auth guard
    if (sessionLoading) {
        return (
            <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
                <Icon name="sync" size={48} className="animate-spin text-indigo-400" />
            </div>
        )
    }
    if (isError || !session?.user) {
        // Redirect to login
        if (typeof window !== 'undefined') window.location.href = '/superadmin/login'
        return null
    }

    const handleLogout = async () => {
        await logoutMutation.mutateAsync()
        navigate('/superadmin/login')
    }

    const handlePlanSave = async () => {
        if (!planModal) return
        await updatePlan.mutateAsync({ storeId: planModal.storeId, plan: selectedPlan })
        setPlanModal(null)
    }

    const handleDomainSave = async () => {
        if (!domainModal) return
        try {
            await updateDomain.mutateAsync({ storeId: domainModal.storeId, customDomain: customDomainInput })
            setDomainModal(null)
        } catch (e) {
            alert(e.details || e.message || 'Gagal mengubah domain')
        }
    }

    const handleDelete = async () => {
        if (!deleteModal) return
        await deleteStore.mutateAsync(deleteModal.storeId)
        setDeleteModal(null)
    }

    const filteredStores = stores.filter(s => {
        if (filterPlan !== 'all' && s.plan !== filterPlan) return false
        if (filterStatus === 'active' && !s.isActive) return false
        if (filterStatus === 'inactive' && s.isActive) return false
        return true
    })

    const tabs = [
        { id: 'overview', label: 'Overview', icon: 'dashboard' },
        { id: 'stores',   label: 'Kelola Toko', icon: 'storefront' },
        { id: 'subscriptions', label: 'Langganan', icon: 'credit_card' },
        { id: 'plans',    label: 'Paket & Fitur', icon: 'workspace_premium' },
    ]

    return (
        <div className="min-h-screen bg-[#0B1120] font-display">
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Icon name="admin_panel_settings" size={22} />
                        </div>
                        <div>
                            <span className="font-bold text-white text-sm">Superadmin Console</span>
                            <span className="text-slate-500 text-xs ml-2 hidden sm:inline">WA Market Platform</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-400 hidden sm:inline">
                            {session.user.name} ({session.user.phone})
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-red-400 hover:text-red-300 font-medium text-xs flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
                        >
                            <Icon name="logout" size={14} /> Keluar
                        </button>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <div className="bg-slate-900/50 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
                            }`}
                        >
                            <Icon name={tab.icon} size={18} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ─── Tab: Overview ─── */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Platform Overview</h2>
                            <p className="text-slate-400 text-sm">Ringkasan statistik platform WA Market secara keseluruhan.</p>
                        </div>

                        {statsLoading ? (
                            <div className="flex justify-center py-12"><Icon name="sync" size={32} className="animate-spin text-indigo-400" /></div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                <StatCard icon="storefront"   label="Total Toko"     value={stats?.totalStores || 0}  color="blue" />
                                <StatCard icon="check_circle" label="Toko Aktif"     value={stats?.activeStores || 0} color="green" />
                                <StatCard icon="group_add"    label="Baru (30 hari)" value={stats?.newStoresThisMonth || 0} color="purple" />
                                <StatCard icon="people"       label="Total User"     value={stats?.totalUsers || 0}   color="amber" />
                                <StatCard icon="receipt_long" label="Total Pesanan"  value={stats?.totalOrders || 0}  color="rose" />
                                <StatCard icon="payments"     label="Total Revenue"  value={formatCurrency(stats?.totalRevenue)} color="green" sub="Seluruh tenant" />
                            </div>
                        )}

                        {/* Quick plan distribution */}
                        {!storesLoading && stores.length > 0 && (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Distribusi Plan</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {['free', 'starter', 'pro'].map(plan => {
                                        const cnt = stores.filter(s => s.plan === plan).length
                                        const pct = stores.length > 0 ? Math.round((cnt / stores.length) * 100) : 0
                                        return (
                                            <div key={plan} className="text-center">
                                                <p className="text-3xl font-bold text-white">{cnt}</p>
                                                <p className="text-xs text-slate-400 mt-1">{PLAN_CONFIG[plan].icon} {PLAN_CONFIG[plan].label}</p>
                                                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{pct}%</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Tab: Kelola Toko ─── */}
                {activeTab === 'stores' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">Kelola Toko</h2>
                                <p className="text-slate-400 text-sm">{stores.length} toko terdaftar di platform</p>
                            </div>
                            <div className="flex gap-2">
                                <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="all">Semua Plan</option>
                                    <option value="free">Free</option>
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                </select>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="all">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>
                        </div>

                        {storesLoading ? (
                            <div className="flex justify-center py-12"><Icon name="sync" size={32} className="animate-spin text-indigo-400" /></div>
                        ) : (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700/50">
                                                <th className="px-5 py-4">Toko</th>
                                                <th className="px-5 py-4">Plan</th>
                                                <th className="px-5 py-4 text-center hidden md:table-cell">Produk</th>
                                                <th className="px-5 py-4 text-center hidden md:table-cell">Order</th>
                                                <th className="px-5 py-4 text-right hidden lg:table-cell">Revenue</th>
                                                <th className="px-5 py-4 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStores.length === 0 ? (
                                                <tr><td colSpan="6" className="px-5 py-12 text-center text-slate-500">Tidak ada toko ditemukan.</td></tr>
                                            ) : filteredStores.map(store => (
                                                <tr key={store.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${store.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                                                            <div>
                                                                <a href={`/s/${store.slug}`} target="_blank" rel="noreferrer" className="font-bold text-white hover:text-indigo-400 transition-colors">
                                                                    {store.name}
                                                                </a>
                                                                <p className="text-xs text-slate-500 font-mono">
                                                                    {store.customDomain ? (
                                                                        <a href={`https://${store.customDomain}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300">
                                                                            {store.customDomain}
                                                                        </a>
                                                                    ) : (
                                                                        `/s/${store.slug}`
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${PLAN_CONFIG[store.plan]?.color || PLAN_CONFIG.free.color}`}>
                                                            {PLAN_CONFIG[store.plan]?.icon} {PLAN_CONFIG[store.plan]?.label || store.plan}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-center text-slate-300 hidden md:table-cell">{store._stats?.products || 0}</td>
                                                    <td className="px-5 py-4 text-center text-slate-300 hidden md:table-cell">{store._stats?.orders || 0}</td>
                                                    <td className="px-5 py-4 text-right text-slate-300 text-xs hidden lg:table-cell">{formatCurrency(store._stats?.revenue)}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => { setDomainModal({ storeId: store.id, storeName: store.name, currentDomain: store.customDomain }); setCustomDomainInput(store.customDomain || ''); }}
                                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Custom Domain"
                                                            >
                                                                <Icon name="language" size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => { setPlanModal({ storeId: store.id, storeName: store.name, currentPlan: store.plan }); setSelectedPlan(store.plan); }}
                                                                className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Ubah Plan"
                                                            >
                                                                <Icon name="workspace_premium" size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => toggleStore.mutate(store.id)}
                                                                disabled={toggleStore.isPending}
                                                                className={`p-2 rounded-lg transition-colors ${store.isActive ? 'text-amber-400 hover:bg-amber-500/10' : 'text-green-400 hover:bg-green-500/10'}`}
                                                                title={store.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                                            >
                                                                <Icon name={store.isActive ? 'pause_circle' : 'play_circle'} size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteModal({ storeId: store.id, storeName: store.name })}
                                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Hapus"
                                                            >
                                                                <Icon name="delete" size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Tab: Plans & Features ─── */}
                {activeTab === 'plans' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Paket & Fitur</h2>
                            <p className="text-slate-400 text-sm">Perbandingan fitur per tingkat langganan toko.</p>
                        </div>

                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700/50">
                                        <th className="px-6 py-4 text-left text-slate-400 text-xs uppercase tracking-wider font-semibold">Fitur</th>
                                        <th className="px-6 py-4 text-center">
                                            <span className="text-slate-300 font-bold">🆓 Free</span>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <span className="text-blue-400 font-bold">🚀 Starter</span>
                                        </th>
                                        <th className="px-6 py-4 text-center">
                                            <span className="text-amber-400 font-bold">👑 Pro</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {PLAN_FEATURES.map((row, i) => (
                                        <tr key={i} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                                            <td className="px-6 py-3.5 text-slate-300 font-medium">{row.feature}</td>
                                            <td className="px-6 py-3.5 text-center text-slate-400">{row.free}</td>
                                            <td className="px-6 py-3.5 text-center text-slate-300">{row.starter}</td>
                                            <td className="px-6 py-3.5 text-center text-amber-300 font-semibold">{row.pro}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Account Info */}
                        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Akun Superadmin</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Nama</p>
                                    <p className="text-white font-medium">{session.user.name}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Nomor WhatsApp</p>
                                    <p className="text-white font-medium">{session.user.phone}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Role</p>
                                    <p className="text-indigo-400 font-bold uppercase text-xs tracking-wider">{session.user.role}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Platform</p>
                                    <p className="text-white font-medium">Cloudflare Workers + D1</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Tab: Subscriptions ─── */}
                {activeTab === 'subscriptions' && (
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1">Riwayat Langganan</h2>
                            <p className="text-slate-400 text-sm">Semua pembayaran subscription dari toko-toko.</p>
                        </div>

                        {subsLoading ? (
                            <div className="text-center py-12">
                                <Icon name="sync" size={32} className="animate-spin text-indigo-400 mx-auto" />
                            </div>
                        ) : allSubscriptions.length === 0 ? (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
                                <Icon name="credit_card_off" size={48} className="text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">Belum ada langganan.</p>
                            </div>
                        ) : (
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-700/50">
                                                <th className="px-4 py-3 text-left text-slate-400 text-xs uppercase">Toko</th>
                                                <th className="px-4 py-3 text-left text-slate-400 text-xs uppercase">Plan</th>
                                                <th className="px-4 py-3 text-left text-slate-400 text-xs uppercase">Provider</th>
                                                <th className="px-4 py-3 text-right text-slate-400 text-xs uppercase">Nominal</th>
                                                <th className="px-4 py-3 text-center text-slate-400 text-xs uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-slate-400 text-xs uppercase">Berlaku</th>
                                                <th className="px-4 py-3 text-left text-slate-400 text-xs uppercase">Tanggal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allSubscriptions.map((sub) => (
                                                <tr key={sub.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                                                    <td className="px-4 py-3 text-white font-medium">{sub.storeName || sub.storeId?.slice(0,8)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${PLAN_CONFIG[sub.plan]?.color || 'bg-slate-700 text-slate-300'}`}>
                                                            {PLAN_CONFIG[sub.plan]?.icon} {sub.plan?.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-300 capitalize">{sub.provider}</td>
                                                    <td className="px-4 py-3 text-right text-green-400 font-bold">{formatCurrency(sub.amount)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                            sub.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                                            sub.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                            'bg-red-500/20 text-red-400'
                                                        }`}>
                                                            {sub.status === 'paid' ? '✅ Paid' : sub.status === 'pending' ? '⏳ Pending' : '❌ ' + sub.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-400 text-xs">
                                                        {sub.periodEnd ? `s/d ${new Date(sub.periodEnd).toLocaleDateString('id-ID')}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-400 text-xs">
                                                        {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('id-ID') : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ─── Modal: Ubah Plan ─── */}
            <Modal isOpen={!!planModal} onClose={() => !updatePlan.isPending && setPlanModal(null)} title={`Ubah Plan — ${planModal?.storeName}`} size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Plan saat ini: <strong className="uppercase">{planModal?.currentPlan}</strong>
                    </p>
                    <div className="space-y-2">
                        {['free', 'starter', 'pro'].map(plan => (
                            <label key={plan}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                    selectedPlan === plan
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <input type="radio" name="plan" value={plan} checked={selectedPlan === plan}
                                    onChange={() => setSelectedPlan(plan)} className="accent-indigo-500" />
                                <span className="font-bold text-sm">{PLAN_CONFIG[plan].icon} {PLAN_CONFIG[plan].label}</span>
                            </label>
                        ))}
                    </div>
                    <button
                        onClick={handlePlanSave}
                        disabled={updatePlan.isPending || selectedPlan === planModal?.currentPlan}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {updatePlan.isPending ? <><Icon name="sync" size={18} className="animate-spin" /> Memproses...</> : <><Icon name="save" size={18} /> Simpan Plan</>}
                    </button>
                </div>
            </Modal>

            {/* ─── Modal: Custom Domain ─── */}
            <Modal isOpen={!!domainModal} onClose={() => !updateDomain.isPending && setDomainModal(null)} title={`Custom Domain`} size="sm">
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Atur domain khusus (misal: <strong>shop.tokoanda.com</strong>) untuk toko <strong>{domainModal?.storeName}</strong>. Kosongkan untuk menghapus custom domain.
                    </p>
                    <div>
                        <input type="text" value={customDomainInput} onChange={e => setCustomDomainInput(e.target.value)}
                            placeholder="Tulis nama domain..."
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
                        <p className="text-xs text-slate-400 mt-2 flex items-start gap-1">
                            <Icon name="info" size={14} className="flex-shrink-0" />
                            <span>Pastikan pengguna sudah mengarahkan CNAME / A Record domain tersebut ke proyek Cloudflare Pages ini di pengaturan DNS mereka.</span>
                        </p>
                    </div>
                    <button
                        onClick={handleDomainSave}
                        disabled={updateDomain.isPending}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {updateDomain.isPending ? <><Icon name="sync" size={18} className="animate-spin" /> Memproses...</> : <><Icon name="save" size={18} /> Simpan Domain</>}
                    </button>
                </div>
            </Modal>

            {/* ─── Modal: Hapus Toko ─── */}
            <Modal isOpen={!!deleteModal} onClose={() => !deleteStore.isPending && setDeleteModal(null)} title="⚠️ Hapus Toko" size="sm">
                <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl">
                        <p className="text-red-700 dark:text-red-300 text-sm font-medium">
                            Anda akan menghapus toko <strong>"{deleteModal?.storeName}"</strong> beserta SELURUH data di dalamnya (produk, pesanan, user, kurir). Aksi ini tidak dapat dibatalkan!
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteModal(null)} disabled={deleteStore.isPending}
                            className="flex-1 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Batal
                        </button>
                        <button onClick={handleDelete} disabled={deleteStore.isPending}
                            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {deleteStore.isPending ? <><Icon name="sync" size={18} className="animate-spin" /> Menghapus...</> : <><Icon name="delete_forever" size={18} /> Hapus Permanen</>}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default SuperAdminPage
