import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon } from '../components/atoms'
import StoreLocationMap from '../components/organisms/StoreLocationMap'
import { settingsApi, rajaongkirApi, uploadApi } from '../api/client'
import { useTheme, useToast } from '../context'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

function AdminSettingsPage() {
    const { updateTheme } = useTheme()
    const toast = useToast()
    const [settings, setSettings] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // RajaOngkir Autocomplete state
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const searchRef = useRef(null)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsApi.getAdminAll()
                const data = response.data
                if (Array.isArray(data)) {
                    // Backend directly returned array of {key, value}
                    const settingsObj = {}
                    data.forEach(s => { settingsObj[s.key] = s.value })
                    setSettings(settingsObj)
                } else if (data && typeof data === 'object') {
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

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Debounced Search for RajaOngkir Location
    useEffect(() => {
        if (!settings.rajaongkir_api_key) return;
        
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 3) {
                setIsSearching(true)
                try {
                    const res = await rajaongkirApi.searchDestination(searchTerm)
                    setSearchResults(res.data?.data || [])
                    setShowDropdown(true)
                } catch (error) {
                    console.error('Failed to search location', error)
                } finally {
                    setIsSearching(false)
                }
            } else {
                setSearchResults([])
                setShowDropdown(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchTerm, settings.rajaongkir_api_key])

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

                        {/* Store Location & Delivery Radius */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="location_on" size={20} />
                                Lokasi & Radius Pengiriman Toko
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Tentukan posisi GPS toko Anda dan radius jangkauan kurir toko (km). Customer hanya bisa memilih "Kurir Toko" jika lokasi pengiriman berada dalam radius ini.
                            </p>
                            <div className="space-y-4">
                                {/* Map */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Posisi Toko di Peta</label>
                                    <StoreLocationMap
                                        lat={settings.store_lat ? parseFloat(settings.store_lat) : null}
                                        lng={settings.store_lng ? parseFloat(settings.store_lng) : null}
                                        radius={settings.store_delivery_radius ? parseFloat(settings.store_delivery_radius) : 5}
                                        onLocationChange={(lat, lng) => {
                                            handleChange('store_lat', String(lat))
                                            handleChange('store_lng', String(lng))
                                        }}
                                    />
                                </div>

                                {/* Use My Location Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!navigator.geolocation) {
                                            toast.error('Browser tidak mendukung GPS')
                                            return
                                        }
                                        navigator.geolocation.getCurrentPosition(
                                            (pos) => {
                                                handleChange('store_lat', String(pos.coords.latitude))
                                                handleChange('store_lng', String(pos.coords.longitude))
                                                toast.success('Lokasi GPS berhasil didapatkan!')
                                            },
                                            () => toast.error('Gagal mendapatkan GPS. Pastikan GPS aktif.'),
                                            { enableHighAccuracy: true }
                                        )
                                    }}
                                    className="w-full py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <Icon name="my_location" size={18} />
                                    Gunakan Lokasi Saya Saat Ini
                                </button>

                                {/* Show saved location */}
                                {settings.store_lat && settings.store_lng && (
                                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                        <p className="text-sm text-green-700 dark:text-green-400">
                                            ✓ Posisi Toko: {parseFloat(settings.store_lat).toFixed(6)}, {parseFloat(settings.store_lng).toFixed(6)}
                                        </p>
                                    </div>
                                )}

                                {/* Delivery Radius */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Radius Pengiriman (km)</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            step="0.5"
                                            value={settings.store_delivery_radius || ''}
                                            onChange={(e) => handleChange('store_delivery_radius', e.target.value)}
                                            placeholder="5"
                                            className={`${inputClass} max-w-[120px]`}
                                        />
                                        <span className="text-sm text-slate-500">km</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Jangkauan maksimal kurir toko dari posisi GPS toko. Jika kosong, Kurir Toko aktif tanpa batasan.</p>
                                </div>

                                {/* Delivery Cost */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Biaya Kurir Toko (Rp)</label>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-slate-500 font-medium">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="500"
                                            value={settings.store_delivery_cost || ''}
                                            onChange={(e) => handleChange('store_delivery_cost', e.target.value)}
                                            placeholder="Misal: 10000"
                                            className={`${inputClass} max-w-[150px]`}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Biaya pengiriman menggunakan kurir toko. Jika dikosongkan atau diset 0, maka biaya kurir Gratis.</p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Schedule */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="schedule" size={20} />
                                Jadwal Pengiriman Kurir Toko
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Tentukan hari dan jam pengiriman yang tersedia. Customer akan melihat jadwal ini saat memilih Kurir Toko.
                            </p>

                            {/* Hours after payment */}
                            <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Estimasi Pengiriman Setelah Pelunasan
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="0"
                                        max="72"
                                        step="1"
                                        value={settings.delivery_hours_after_payment || ''}
                                        onChange={(e) => handleChange('delivery_hours_after_payment', e.target.value)}
                                        placeholder="3"
                                        className={`${inputClass} max-w-[100px]`}
                                    />
                                    <span className="text-sm text-slate-500">jam setelah pelunasan</span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">Contoh: isi 3 artinya pesanan dikirim estimasi 3 jam setelah pembayaran lunas. Kosongkan jika tidak ada estimasi.</p>
                            </div>

                            {/* Day Schedule */}
                            <div className="space-y-3">
                                {(() => {
                                    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
                                    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

                                    // Parse schedule from settings
                                    let schedule = {}
                                    try {
                                        schedule = settings.delivery_schedule ? JSON.parse(settings.delivery_schedule) : {}
                                    } catch { schedule = {} }

                                    const updateSchedule = (newSchedule) => {
                                        handleChange('delivery_schedule', JSON.stringify(newSchedule))
                                    }

                                    const toggleDay = (dayKey) => {
                                        const newSched = { ...schedule }
                                        if (newSched[dayKey]) {
                                            delete newSched[dayKey]
                                        } else {
                                            newSched[dayKey] = ['09:00']
                                        }
                                        updateSchedule(newSched)
                                    }

                                    const addTimeSlot = (dayKey) => {
                                        const newSched = { ...schedule }
                                        const slots = [...(newSched[dayKey] || [])]
                                        slots.push('12:00')
                                        newSched[dayKey] = slots
                                        updateSchedule(newSched)
                                    }

                                    const removeTimeSlot = (dayKey, idx) => {
                                        const newSched = { ...schedule }
                                        const slots = [...(newSched[dayKey] || [])]
                                        slots.splice(idx, 1)
                                        if (slots.length === 0) {
                                            delete newSched[dayKey]
                                        } else {
                                            newSched[dayKey] = slots
                                        }
                                        updateSchedule(newSched)
                                    }

                                    const updateTimeSlot = (dayKey, idx, value) => {
                                        const newSched = { ...schedule }
                                        const slots = [...(newSched[dayKey] || [])]
                                        slots[idx] = value
                                        newSched[dayKey] = slots
                                        updateSchedule(newSched)
                                    }

                                    return days.map((dayName, i) => {
                                        const dayKey = dayKeys[i]
                                        const isActive = !!schedule[dayKey]
                                        const slots = schedule[dayKey] || []
                                        return (
                                            <div key={dayKey} className={`rounded-xl border transition-all ${isActive ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'} p-4`}>
                                                <div className="flex items-center justify-between">
                                                    <label className="flex items-center gap-3 cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={isActive}
                                                            onChange={() => toggleDay(dayKey)}
                                                            className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                                                        />
                                                        <span className={`font-semibold text-sm ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{dayName}</span>
                                                    </label>
                                                    {isActive && (
                                                        <button
                                                            type="button"
                                                            onClick={() => addTimeSlot(dayKey)}
                                                            className="text-xs font-medium text-primary hover:text-primary-dark flex items-center gap-1"
                                                        >
                                                            <Icon name="add" size={14} /> Tambah Jam
                                                        </button>
                                                    )}
                                                </div>
                                                {isActive && slots.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {slots.map((time, idx) => (
                                                            <div key={idx} className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 px-2 py-1">
                                                                <input
                                                                    type="time"
                                                                    value={time}
                                                                    onChange={(e) => updateTimeSlot(dayKey, idx, e.target.value)}
                                                                    className="text-sm bg-transparent text-slate-900 dark:text-white border-none outline-none p-0 w-[80px]"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeTimeSlot(dayKey, idx)}
                                                                    className="text-red-400 hover:text-red-600 p-0.5"
                                                                    title="Hapus jam ini"
                                                                >
                                                                    <Icon name="close" size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                })()}
                            </div>
                            <p className="text-xs text-slate-400 mt-3">
                                💡 Hari yang tidak dicentang artinya tidak ada pengiriman kurir toko di hari tersebut. Jika semua kosong, jadwal tidak ditampilkan ke customer.
                            </p>
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
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipe Akun API</label>
                                            <select 
                                                value={settings.rajaongkir_tier || 'starter'} 
                                                onChange={(e) => handleChange('rajaongkir_tier', e.target.value)} 
                                                className={inputClass}
                                            >
                                                <option value="starter">Starter (Tanpa Kecamatan)</option>
                                                <option value="basic">Basic</option>
                                                <option value="pro">Pro (Dukung Kecamatan)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key RajaOngkir</label>
                                            <input type="password" value={settings.rajaongkir_api_key || ''} onChange={(e) => handleChange('rajaongkir_api_key', e.target.value)} placeholder="Masukkan API Key dari rajaongkir.com" className={inputClass} />
                                            <p className="text-xs text-slate-400 mt-1">Dapatkan API Key di <a href="https://rajaongkir.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">rajaongkir.com</a></p>
                                        </div>

                                        {/* Origin Location Selection */}
                                        {settings.rajaongkir_api_key && (
                                            <div className="space-y-4">
                                                <div ref={searchRef} className="relative">
                                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                        Lokasi Asal Pengiriman
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Icon name="search" size={18} className="text-slate-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            onFocus={() => {
                                                                if (searchResults.length > 0) setShowDropdown(true);
                                                            }}
                                                            placeholder="Cari Kota / Kecamatan asal..."
                                                            className={`${inputClass} pl-10`}
                                                        />
                                                        {isSearching && (
                                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                                <Icon name="progress_activity" size={18} className="text-slate-400 animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Selected Value Display */}
                                                    {settings.rajaongkir_origin_name && !showDropdown && (
                                                        <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center">
                                                            <div>
                                                                <p className="text-xs text-primary font-semibold mb-0.5">Asal Terpilih:</p>
                                                                <p className="text-sm font-medium text-slate-800 dark:text-white">
                                                                    {settings.rajaongkir_origin_name}
                                                                </p>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    handleChange('rajaongkir_origin', '');
                                                                    handleChange('rajaongkir_origin_name', '');
                                                                    setSearchTerm('');
                                                                }}
                                                                className="text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Icon name="close" size={20} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Autocomplete Dropdown */}
                                                    {showDropdown && searchResults.length > 0 && (
                                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                            <ul className="py-1 text-sm text-slate-700 dark:text-slate-200">
                                                                {searchResults.map((loc) => (
                                                                    <li
                                                                        key={loc.id}
                                                                        onClick={() => {
                                                                            handleChange('rajaongkir_origin', String(loc.id));
                                                                            handleChange('rajaongkir_origin_name', loc.label);
                                                                            setSearchTerm('');
                                                                            setShowDropdown(false);
                                                                        }}
                                                                        className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                                                    >
                                                                        <div className="font-medium text-slate-900 dark:text-white">{loc.subdistrict_name !== '-' ? loc.subdistrict_name : loc.district_name}</div>
                                                                        <div className="text-xs text-slate-500 truncate">{loc.label}</div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
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
