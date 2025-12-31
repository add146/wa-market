import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon } from '../components/atoms'
import { settingsApi } from '../api/client'
import { useTheme } from '../context'

/**
 * AdminSettingsPage - Store settings management for admins
 */
function AdminSettingsPage() {
    const { updateTheme } = useTheme()
    const [settings, setSettings] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsApi.getAll()
                const data = response.data

                // API returns key-value object directly, or could be wrapped
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    // Direct object format: { store_name: 'value', ... }
                    if (!data.data) {
                        setSettings(data)
                    } else if (Array.isArray(data.data)) {
                        // Array format: { data: [{ key: 'store_name', value: 'x' }, ...] }
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
            // Save all settings
            for (const [key, value] of Object.entries(settings)) {
                if (value !== undefined && value !== null) {
                    await settingsApi.update(key, value)
                }
            }

            // Apply theme immediately
            if (settings.theme_primary || settings.theme_accent) {
                updateTheme({
                    primary: settings.theme_primary || '#10b981',
                    accent: settings.theme_accent || '#f97316'
                })
            }

            setMessage('Pengaturan berhasil disimpan!')
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            alert('Gagal menyimpan pengaturan')
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    return (
        <>
            <AdminHeader
                title="Pengaturan Toko"
                subtitle="Konfigurasi toko Anda"
            />

            <div className="flex-1 overflow-y-auto p-6">
                {message && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 flex items-center gap-2">
                        <Icon name="check_circle" size={20} />
                        {message}
                    </div>
                )}

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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nama Toko
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.store_name || ''}
                                        onChange={(e) => handleChange('store_name', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Logo URL
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.logo_url || ''}
                                        onChange={(e) => handleChange('logo_url', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* WhatsApp Config */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="chat" size={20} />
                                Konfigurasi WhatsApp
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        WhatsApp CS
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.whatsapp_cs || ''}
                                        onChange={(e) => handleChange('whatsapp_cs', e.target.value)}
                                        placeholder="6281234567890"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        WhatsApp Kasir
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.whatsapp_kasir || ''}
                                        onChange={(e) => handleChange('whatsapp_kasir', e.target.value)}
                                        placeholder="6281234567890"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Warna Primary
                                    </label>
                                    <input
                                        type="color"
                                        value={settings.theme_primary || '#10b981'}
                                        onChange={(e) => handleChange('theme_primary', e.target.value)}
                                        className="w-full h-10 rounded-lg cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Warna Accent
                                    </label>
                                    <input
                                        type="color"
                                        value={settings.theme_accent || '#f97316'}
                                        onChange={(e) => handleChange('theme_accent', e.target.value)}
                                        className="w-full h-10 rounded-lg cursor-pointer"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    handleChange('theme_primary', '#10b981')
                                    handleChange('theme_accent', '#f97316')
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                <Icon name="refresh" size={16} />
                                Reset ke Default
                            </button>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default AdminSettingsPage
