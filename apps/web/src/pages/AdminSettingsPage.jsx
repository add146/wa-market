import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon } from '../components/atoms'
import { settingsApi, rajaongkirApi } from '../api/client'
import { useTheme, useToast } from '../context'

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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logo URL</label>
                                    <input type="text" value={settings.logo_url || ''} onChange={(e) => handleChange('logo_url', e.target.value)} className={inputClass} />
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

                        {/* RajaOngkir API */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="local_shipping" size={20} />
                                RajaOngkir (Ongkos Kirim)
                            </h3>
                            <div className="space-y-4">
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
                            </div>
                        </div>

                        {/* Theme */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="palette" size={20} />
                                Tema
                            </h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Primary</label>
                                    <input type="color" value={settings.theme_primary || '#10b981'} onChange={(e) => handleChange('theme_primary', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Accent</label>
                                    <input type="color" value={settings.theme_accent || '#f97316'} onChange={(e) => handleChange('theme_accent', e.target.value)} className="w-full h-10 rounded-lg cursor-pointer" />
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
