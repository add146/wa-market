import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon } from '../components/atoms'
import { settingsApi, uploadApi } from '../api/client'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

const getImageUrl = (url) => {
    if (url?.startsWith('/uploads')) return `${API_BASE}${url}`
    return url || ''
}

function AdminBannersPage() {
    const [settings, setSettings] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [uploadingBanner, setUploadingBanner] = useState(null)

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

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const bannerKeys = [
                'banner1_image', 'banner1_badge', 'banner1_title', 'banner1_desc',
                'banner2_image', 'banner2_label', 'banner2_promo',
                'banner3_image', 'banner3_label', 'banner3_promo'
            ]
            for (const key of bannerKeys) {
                if (settings[key] !== undefined && settings[key] !== null) {
                    await settingsApi.update(key, settings[key])
                }
            }
            setMessage('Banner berhasil disimpan!')
            setTimeout(() => setMessage(''), 3000)
        } catch (err) {
            alert('Gagal menyimpan banner')
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleImageUpload = async (bannerKey, file) => {
        if (!file) return
        setUploadingBanner(bannerKey)
        try {
            const res = await uploadApi.upload(file)
            handleChange(bannerKey, res.data.url)
        } catch (err) {
            alert('Gagal upload gambar: ' + err.message)
        } finally {
            setUploadingBanner(null)
        }
    }

    const inputClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"

    return (
        <>
            <AdminHeader title="Kelola Banner" subtitle="Edit banner homepage" />

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
                    <div className="space-y-6 max-w-3xl">
                        {/* Preview */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Preview</h3>
                            <div className="grid grid-cols-3 gap-3 h-40">
                                <div className="col-span-2 rounded-lg bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: `url('${getImageUrl(settings.banner1_image) || 'https://via.placeholder.com/600x300'}')` }}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
                                    <div className="absolute bottom-2 left-2 text-white text-xs">
                                        <span className="bg-orange-500 px-1 rounded text-[10px]">{settings.banner1_badge || 'Badge'}</span>
                                        <p className="font-bold mt-1">{settings.banner1_title || 'Judul Banner'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div className="flex-1 rounded-lg bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: `url('${getImageUrl(settings.banner2_image) || 'https://via.placeholder.com/300x150'}')` }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-1 left-1 text-white text-[10px]">
                                            <p>{settings.banner2_label || 'Label'}</p>
                                            <p className="font-bold">{settings.banner2_promo || 'Promo'}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 rounded-lg bg-cover bg-center relative overflow-hidden" style={{ backgroundImage: `url('${getImageUrl(settings.banner3_image) || 'https://via.placeholder.com/300x150'}')` }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-1 left-1 text-white text-[10px]">
                                            <p>{settings.banner3_label || 'Label'}</p>
                                            <p className="font-bold">{settings.banner3_promo || 'Promo'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Banner 1 */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="photo_size_select_actual" size={20} />
                                Banner Utama (Besar)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Gambar</label>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">📐 Ukuran ideal: <strong>1200 x 480 px</strong> (rasio 5:2)</p>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload('banner1_image', e.target.files[0])} className="w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white" />
                                    {uploadingBanner === 'banner1_image' && <p className="text-xs text-primary mt-1">Uploading...</p>}
                                    {settings.banner1_image && <img src={getImageUrl(settings.banner1_image)} alt="Banner 1" className="mt-2 h-24 rounded-lg object-cover" />}
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Badge</label>
                                    <input type="text" value={settings.banner1_badge || ''} onChange={(e) => handleChange('banner1_badge', e.target.value)} placeholder="Flash Sale" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Judul</label>
                                    <input type="text" value={settings.banner1_title || ''} onChange={(e) => handleChange('banner1_title', e.target.value)} placeholder="Pesta Belanja" className={inputClass} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Deskripsi</label>
                                    <input type="text" value={settings.banner1_desc || ''} onChange={(e) => handleChange('banner1_desc', e.target.value)} placeholder="Diskon hingga 70%" className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Banner 2 */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="crop_portrait" size={20} />
                                Banner Samping 1
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Gambar</label>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">📐 Ukuran ideal: <strong>400 x 230 px</strong> (rasio 16:9)</p>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload('banner2_image', e.target.files[0])} className="w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white" />
                                    {uploadingBanner === 'banner2_image' && <p className="text-xs text-primary mt-1">Uploading...</p>}
                                    {settings.banner2_image && <img src={getImageUrl(settings.banner2_image)} alt="Banner 2" className="mt-2 h-20 rounded-lg object-cover" />}
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Label</label>
                                    <input type="text" value={settings.banner2_label || ''} onChange={(e) => handleChange('banner2_label', e.target.value)} placeholder="Audio Premium" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Promo</label>
                                    <input type="text" value={settings.banner2_promo || ''} onChange={(e) => handleChange('banner2_promo', e.target.value)} placeholder="Mulai Rp 50rb" className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Banner 3 */}
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="crop_portrait" size={20} />
                                Banner Samping 2
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Gambar</label>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">📐 Ukuran ideal: <strong>400 x 230 px</strong> (rasio 16:9)</p>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload('banner3_image', e.target.files[0])} className="w-full text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white" />
                                    {uploadingBanner === 'banner3_image' && <p className="text-xs text-primary mt-1">Uploading...</p>}
                                    {settings.banner3_image && <img src={getImageUrl(settings.banner3_image)} alt="Banner 3" className="mt-2 h-20 rounded-lg object-cover" />}
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Label</label>
                                    <input type="text" value={settings.banner3_label || ''} onChange={(e) => handleChange('banner3_label', e.target.value)} placeholder="Sepatu Sport" className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Promo</label>
                                    <input type="text" value={settings.banner3_promo || ''} onChange={(e) => handleChange('banner3_promo', e.target.value)} placeholder="Cashback 20%" className={inputClass} />
                                </div>
                            </div>
                        </div>

                        {/* Save */}
                        <button onClick={handleSave} disabled={isSaving} className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50">
                            {isSaving ? 'Menyimpan...' : 'Simpan Banner'}
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}

export default AdminBannersPage
