import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon } from '../components/atoms'
import { settingsApi, rajaongkirApi, uploadApi } from '../api/client'
import { useTheme, useToast } from '../context'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

function AdminSettingsPage() {
    const { updateTheme } = useTheme()
    const toast = useToast()
    const [settings, setSettings] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // RajaOngkir Direct Search state
    const [originSearch, setOriginSearch] = useState('')
    const [originResults, setOriginResults] = useState([])
    const [selectedOrigin, setSelectedOrigin] = useState(null)
    const [showOriginResults, setShowOriginResults] = useState(false)
    const [loadingOriginSearch, setLoadingOriginSearch] = useState(false)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsApi.getAll()
                const data = response.data
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    if (!data.data) {
                        setSettings(data)
                    } else if (Array.isArray(data.data)) {
                        const settingsObj = {}
                        data.data.forEach(s => { settingsObj[s.key] = s.value })
                        setSettings(settingsObj)
                    } else {
                        setSettings(data.data)
                    }
                }
            } catch (err) {
                console.error('Failed to load settings:', err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const handleSaveAll = async () => {
        setIsSaving(true)
        try {
            for (const [key, value] of Object.entries(settings)) {
                if (value !== undefined && value !== null) {
                    await settingsApi.update(key, value)
                }
            }
            if (settings.theme_primary || settings.theme_accent) {
                updateTheme({
                    primary: settings.theme_primary || '#10b981',
                    accent: settings.theme_accent || '#f97316'
                })
            }
            toast.success('Pengaturan berhasil disimpan!')
        } catch (err) {
            toast.error('Gagal menyimpan pengaturan')
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"

    return (
        <>
            <AdminHeader title="Pengaturan Toko" subtitle="Konfigurasi toko Anda" />

            <div className="flex-1 overflow-y-auto p-6">

                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : (
                    <div className="space-y-6 max-w-2xl">
                        {/* Store Info */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="storefront" size={20} />
                                Informasi Toko
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Toko</label>
                                    <input type="text" value={settings.store_name || ''} onChange={(e) => handleChange('store_name', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Keterangan Singkat</label>
                                    <input type="text" value={settings.store_tagline || ''} onChange={(e) => handleChange('store_tagline', e.target.value)} placeholder="Belanja mudah, harga terjangkau" className={inputClass} />
                                    <p className="text-xs text-slate-400 mt-1">Akan tampil di tab browser bersama nama toko</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo Toko</label>
                                    <div className="flex items-center gap-4">
                                        {settings.logo_url && (
                                            <img
                                                src={settings.logo_url?.startsWith('/uploads') ? `${API_BASE}${settings.logo_url}` : settings.logo_url}
                                                alt="Logo"
                                                className="w-16 h-16 object-contain rounded-lg border border-slate-200 dark:border-slate-600 bg-white"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0]
                                                    if (!file) return
                                                    try {
                                                        const res = await uploadApi.upload(file)
                                                        handleChange('logo_url', res.data.url)
                                                        toast.success('Logo berhasil diupload!')
                                                    } catch (err) {
                                                        toast.error('Gagal upload logo')
                                                    }
                                                }}
                                                className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer"
                                            />
                                            <p className="text-xs text-slate-400 mt-1">📐 Ukuran ideal: 200 x 200 px (rasio 1:1)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="chat" size={20} />
                                WhatsApp
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp CS</label>
                                    <input type="text" value={settings.whatsapp_cs || ''} onChange={(e) => handleChange('whatsapp_cs', e.target.value)} placeholder="6281234567890" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp Kasir</label>
                                    <input type="text" value={settings.whatsapp_kasir || ''} onChange={(e) => handleChange('whatsapp_kasir', e.target.value)} placeholder="6281234567890" className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* WAHA Gateway */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="devices" size={20} />
                                WAHA Gateway API
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Konfigurasi otomatisasi Broadcast & Notifikasi WhatsApp.
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Server URL</label>
                                    <input 
                                        type="url" 
                                        value={settings.waha_server_url || ''} 
                                        onChange={(e) => handleChange('waha_server_url', e.target.value)} 
                                        placeholder="https://waha.domain.com" 
                                        className={inputClass} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
                                    <input 
                                        type="password" 
                                        value={settings.waha_api_key || ''} 
                                        onChange={(e) => handleChange('waha_api_key', e.target.value)} 
                                        placeholder="Secret API Key (Opsional)" 
                                        className={inputClass} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Session Name</label>
                                    <input 
                                        type="text" 
                                        value={settings.waha_session || ''} 
                                        onChange={(e) => handleChange('waha_session', e.target.value)} 
                                        placeholder="default" 
                                        className={inputClass} 
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Gunakan "default" jika menggunakan versi gratis.</p>
                                </div>
                            </div>
                        </div>

                        {/* RajaOngkir API */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="local_shipping" size={20} />
                                RajaOngkir (Ongkos Kirim)
                            </h3>
                            <div className="space-y-4">
                                {/* Enable/Disable Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Aktifkan RajaOngkir</p>
                                        <p className="text-xs text-slate-500">Jika dinonaktifkan, opsi kurir RajaOngkir tidak muncul di checkout</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.rajaongkir_enabled === 'true' || settings.rajaongkir_enabled === true}
                                            onChange={(e) => handleChange('rajaongkir_enabled', e.target.checked ? 'true' : 'false')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                {/* Only show API settings if enabled */}
                                {(settings.rajaongkir_enabled === 'true' || settings.rajaongkir_enabled === true) && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key RajaOngkir</label>
                                            <input type="password" value={settings.rajaongkir_api_key || ''} onChange={(e) => handleChange('rajaongkir_api_key', e.target.value)} placeholder="Masukkan API Key dari rajaongkir.com" className={inputClass} />
                                            <p className="text-xs text-slate-400 mt-1">Dapatkan API Key di <a href="https://rajaongkir.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">rajaongkir.com</a></p>
                                        </div>

                                        {/* Origin Location Search */}
                                        {settings.rajaongkir_api_key && (
                                            <div className="relative">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lokasi Asal Pengiriman</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={originSearch}
                                                        onChange={async (e) => {
                                                            setOriginSearch(e.target.value)
                                                            setShowOriginResults(true)
                                                            setSelectedOrigin(null)

                                                            if (e.target.value.length >= 3) {
                                                                setLoadingOriginSearch(true)
                                                                try {
                                                                    const response = await rajaongkirApi.searchDestination(e.target.value)
                                                                    setOriginResults(response.data?.data || [])
                                                                } catch (err) {
                                                                    console.error('Search error:', err)
                                                                    setOriginResults([])
                                                                } finally {
                                                                    setLoadingOriginSearch(false)
                                                                }
                                                            } else {
                                                                setOriginResults([])
                                                            }
                                                        }}
                                                        onFocus={() => setShowOriginResults(true)}
                                                        placeholder="Ketik nama kota/kecamatan (min 3 huruf)..."
                                                        className={inputClass}
                                                    />
                                                    {loadingOriginSearch && (
                                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">⏳</span>
                                                    )}
                                                </div>

                                                {/* Search Results Dropdown */}
                                                {showOriginResults && originResults.length > 0 && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                                        {originResults.map((loc, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedOrigin(loc)
                                                                    setOriginSearch(loc.label)
                                                                    setShowOriginResults(false)
                                                                    handleChange('rajaongkir_origin_city', String(loc.id))
                                                                    handleChange('rajaongkir_origin_city_name', loc.label)
                                                                }}
                                                                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                            >
                                                                <p className="font-medium text-slate-900 dark:text-white text-sm">{loc.subdistrict_name}</p>
                                                                <p className="text-xs text-slate-500">{loc.district_name}, {loc.city_name}, {loc.province_name}</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Selected Origin */}
                                                {selectedOrigin && (
                                                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                        <p className="text-sm text-green-700 dark:text-green-400">✓ Asal: {selectedOrigin.label}</p>
                                                    </div>
                                                )}

                                                {/* Saved Origin */}
                                                {settings.rajaongkir_origin_city_name && !selectedOrigin && (
                                                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                        <p className="text-sm text-green-700 dark:text-green-400">✓ Tersimpan: {settings.rajaongkir_origin_city_name}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Courier Selection */}
                                        {settings.rajaongkir_api_key && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kurir yang Tersedia</label>
                                                <p className="text-xs text-slate-400 mb-3">Pilih kurir yang ingin ditampilkan saat checkout</p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {[
                                                        { code: 'jne', name: 'JNE' },
                                                        { code: 'sicepat', name: 'SiCepat' },
                                                        { code: 'jnt', name: 'J&T Express' },
                                                        { code: 'pos', name: 'POS Indonesia' },
                                                        { code: 'tiki', name: 'TIKI' },
                                                        { code: 'anteraja', name: 'AnterAja' },
                                                        { code: 'ninja', name: 'Ninja Express' },
                                                        { code: 'lion', name: 'Lion Parcel' },
                                                        { code: 'ide', name: 'ID Express' },
                                                    ].map((courier) => {
                                                        const selectedCouriers = (settings.rajaongkir_couriers || 'jne:sicepat:jnt').split(':')
                                                        const isSelected = selectedCouriers.includes(courier.code)
                                                        return (
                                                            <label
                                                                key={courier.code}
                                                                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                                                    ? 'border-primary bg-primary/10 text-primary'
                                                                    : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={(e) => {
                                                                        let newCouriers = [...selectedCouriers]
                                                                        if (e.target.checked) {
                                                                            newCouriers.push(courier.code)
                                                                        } else {
                                                                            newCouriers = newCouriers.filter(c => c !== courier.code)
                                                                        }
                                                                        // Ensure at least one courier is selected
                                                                        if (newCouriers.length === 0) {
                                                                            newCouriers = ['jne']
                                                                        }
                                                                        handleChange('rajaongkir_couriers', newCouriers.join(':'))
                                                                    }}
                                                                    className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                                />
                                                                <span className="text-sm font-medium">{courier.name}</span>
                                                            </label>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Payment Gateway */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="payments" size={20} />
                                Payment Gateway
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Aktifkan pembayaran online agar customer bisa bayar langsung saat checkout. Jika tidak diaktifkan, pembayaran tetap melalui WhatsApp (manual).
                            </p>
                            <div className="space-y-4">
                                {/* Enable Toggle */}
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Aktifkan Payment Gateway</p>
                                        <p className="text-xs text-slate-500">Pilihan bayar online muncul di checkout</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.payment_gateway_enabled === 'true' || settings.payment_gateway_enabled === true}
                                            onChange={(e) => handleChange('payment_gateway_enabled', e.target.checked ? 'true' : 'false')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                {(settings.payment_gateway_enabled === 'true' || settings.payment_gateway_enabled === true) && (
                                    <>
                                        {/* Provider Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Provider Pembayaran</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: 'xendit', label: 'Xendit', desc: 'Invoice-based' },
                                                    { value: 'midtrans', label: 'Midtrans', desc: 'Snap Redirect' },
                                                ].map((prov) => {
                                                    const isActive = settings.payment_provider === prov.value
                                                    return (
                                                        <button
                                                            key={prov.value}
                                                            type="button"
                                                            onClick={() => handleChange('payment_provider', prov.value)}
                                                            className={`p-4 rounded-xl border-2 text-left transition-all ${isActive
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                                            }`}
                                                        >
                                                            <p className="font-bold text-slate-900 dark:text-white">{prov.label}</p>
                                                            <p className="text-xs text-slate-500">{prov.desc}</p>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        {/* Xendit Keys */}
                                        {settings.payment_provider === 'xendit' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Xendit Secret Key</label>
                                                    <input type="password" value={settings.xendit_secret_key || ''} onChange={(e) => handleChange('xendit_secret_key', e.target.value)} placeholder="xnd_production_..." className={inputClass} />
                                                    <p className="text-xs text-slate-400 mt-1">Dapatkan di <a href="https://dashboard.xendit.co/settings/developers#api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Xendit Dashboard → API Keys</a></p>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Webhook Verification Token (Opsional)</label>
                                                    <input type="password" value={settings.xendit_webhook_token || ''} onChange={(e) => handleChange('xendit_webhook_token', e.target.value)} placeholder="Token dari Xendit Dashboard" className={inputClass} />
                                                </div>
                                                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                                                    <h4 className="flex items-center gap-2 font-bold text-primary mb-2 text-sm">
                                                        <Icon name="info" size={18} /> Tutorial Webhook Xendit
                                                    </h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                                                        Agar sistem tahu kapan pelanggan telah berhasil membayar, Anda <strong>wajib</strong> mendaftarkan URL Webhook ini di dashboard Xendit (Callback URL).
                                                    </p>
                                                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 break-all font-mono text-xs text-green-400 mb-3">
                                                        {(import.meta.env.VITE_API_URL || 'https://wa-market-api.khibrohstudio.workers.dev/api')}
                                                        <span className="text-white">/payment/webhook/xendit</span>
                                                    </div>
                                                    <ol className="list-decimal pl-4 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                                        <li>Buka Xendit <strong>Dashboard &gt; Settings &gt; Developers &gt; Webhooks</strong>.</li>
                                                        <li>Centang <strong>Invoice paid</strong>.</li>
                                                        <li>Tempel (Paste) URL di atas pada kolom yang tersedia, lalu Simpan.</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        )}

                                        {/* Midtrans Keys */}
                                        {settings.payment_provider === 'midtrans' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Midtrans Server Key</label>
                                                    <input type="password" value={settings.midtrans_server_key || ''} onChange={(e) => handleChange('midtrans_server_key', e.target.value)} placeholder="Mid-server-..." className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Midtrans Client Key</label>
                                                    <input type="text" value={settings.midtrans_client_key || ''} onChange={(e) => handleChange('midtrans_client_key', e.target.value)} placeholder="Mid-client-..." className={inputClass} />
                                                </div>
                                                <p className="text-xs text-slate-400">Dapatkan di <a href="https://dashboard.midtrans.com/settings/config_info" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Midtrans Dashboard → Configuration</a></p>
                                                
                                                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-xl">
                                                    <h4 className="flex items-center gap-2 font-bold text-primary mb-2 text-sm">
                                                        <Icon name="info" size={18} /> Tutorial Webhook Midtrans
                                                    </h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                                                        Agar sistem otomatis memverifikasi saat pelanggan sudah membayar, Anda <strong>wajib</strong> mengisi Notification URL di Dashboard Midtrans.
                                                    </p>
                                                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 break-all font-mono text-xs text-green-400 mb-3">
                                                        {(import.meta.env.VITE_API_URL || 'https://wa-market-api.khibrohstudio.workers.dev/api')}
                                                        <span className="text-white">/payment/webhook/midtrans</span>
                                                    </div>
                                                    <ol className="list-decimal pl-4 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                                        <li>Buka <a href="https://dashboard.midtrans.com/settings/vtweb_configuration" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings &gt; Payment Link</a> atau <a href="https://dashboard.midtrans.com/settings/snap_preference" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Settings &gt; Snap Preferences</a> di Midtrans.</li>
                                                        <li>Di bagian <strong>Payment Notification URL</strong>, tempel/paste URL di atas.</li>
                                                        <li>Klik <strong>Save / Simpan</strong>.</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                        {/* Theme */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="palette" size={20} />
                                Tema
                            </h3>

                            {/* Preset Theme Buttons */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Pilih Tema</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { name: 'Emerald', primary: '#10b981', accent: '#f97316' },
                                        { name: 'Ocean', primary: '#0ea5e9', accent: '#f59e0b' },
                                        { name: 'Sunset', primary: '#f97316', accent: '#ef4444' },
                                        { name: 'Purple', primary: '#8b5cf6', accent: '#ec4899' },
                                        { name: 'Rose', primary: '#f43f5e', accent: '#fb923c' },
                                        { name: 'Amber', primary: '#f59e0b', accent: '#84cc16' },
                                        { name: 'Teal', primary: '#14b8a6', accent: '#6366f1' },
                                        { name: 'Slate', primary: '#64748b', accent: '#06b6d4' },
                                    ].map((preset) => {
                                        const isActive = settings.theme_primary === preset.primary && settings.theme_accent === preset.accent
                                        return (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                onClick={() => {
                                                    handleChange('theme_primary', preset.primary)
                                                    handleChange('theme_accent', preset.accent)
                                                }}
                                                className={`relative p-2 rounded-lg border-2 transition-all ${isActive
                                                    ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-slate-900 dark:ring-white'
                                                    : 'border-slate-200 dark:border-slate-600 hover:border-slate-400'
                                                    }`}
                                            >
                                                <div className="flex gap-1 mb-1">
                                                    <div
                                                        className="w-6 h-6 rounded-full"
                                                        style={{ backgroundColor: preset.primary }}
                                                    />
                                                    <div
                                                        className="w-6 h-6 rounded-full"
                                                        style={{ backgroundColor: preset.accent }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{preset.name}</span>
                                                {isActive && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                                        <Icon name="check" size={12} className="text-white" />
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Custom Color Picker */}
                            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Atau Pilih Warna Kustom</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Primary</label>
                                        <input type="color" value={settings.theme_primary || '#10b981'} onChange={(e) => handleChange('theme_primary', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Accent</label>
                                        <input type="color" value={settings.theme_accent || '#f97316'} onChange={(e) => handleChange('theme_accent', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save */}
                        <button onClick={handleSaveAll} disabled={isSaving} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default AdminSettingsPage
