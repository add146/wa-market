import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Icon, Modal } from '../../components/atoms'
import { useRegisterStore, useCheckSlug, useLandingSettings } from '../../hooks'
import { useToast } from '../../context'

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Icon name={icon} size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function LandingPage() {
    const [showRegisterModal, setShowRegisterModal] = useState(false)
    const toast = useToast()
    const { data: landingSettings } = useLandingSettings()

    // Form state
    const [formData, setFormData] = useState({
        storeName: '',
        slug: '',
        adminName: '',
        adminPhone: '',
        adminPassword: ''
    })
    
    // Auto-generate slug from storeName if user hasn't typed in it manually
    const [isSlugManual, setIsSlugManual] = useState(false)
    
    useEffect(() => {
        if (!isSlugManual && formData.storeName) {
            const autoSlug = formData.storeName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
            setFormData(prev => ({ ...prev, slug: autoSlug }))
        }
    }, [formData.storeName, isSlugManual])

    const { data: slugCheck, isFetching: isCheckingSlug } = useCheckSlug(formData.slug)
    const registerStore = useRegisterStore()

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name === 'slug') setIsSlugManual(true)
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!slugCheck?.available) {
            toast.error('URL Toko tidak tersedia. Silakan pilih yang lain.')
            return
        }

        // Format phone
        let formattedPhone = formData.adminPhone
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1)
        }

        try {
            await registerStore.mutateAsync({
                ...formData,
                adminPhone: formattedPhone
            })
            
            toast.success('Hore! Toko Anda berhasil dibuat.')
            setShowRegisterModal(false)
            
            // Redirect to the new store's login page
            setTimeout(() => {
                window.location.href = `/s/${formData.slug}/login`
            }, 1000)
        } catch (error) {
            toast.error(error.response?.data?.error || 'Gagal membuat toko. Coba lagi.')
        }
    }

    // Dynamic SEO
    useEffect(() => {
        if (landingSettings?.landing_meta_title) {
            document.title = landingSettings.landing_meta_title
        }
        if (landingSettings?.landing_meta_description) {
            let metaDesc = document.querySelector('meta[name="description"]')
            if (!metaDesc) {
                metaDesc = document.createElement('meta')
                metaDesc.name = "description"
                document.head.appendChild(metaDesc)
            }
            metaDesc.content = landingSettings.landing_meta_description
        }
    }, [landingSettings])

    // Dynamic Features
    let featuresList = [
        { icon: 'chat', title: 'Notifikasi WAHA API', desc: 'Tagihan dan resi dikirim otomatis ke WhatsApp pelanggan tanpa perlu mengetik manual.' },
        { icon: 'storefront', title: 'Multi-Tenant SaaS', desc: 'Satu platform, ribuan toko. Setiap toko memiliki URL isolasi unik dan database tersendiri.' },
        { icon: 'two_wheeler', title: 'Manajemen Kurir', desc: 'Tugaskan armada pengantaran toko Anda sendiri dengan panel kurir khusus berdesain ringan.' },
        { icon: 'inventory', title: 'Katalog Produk', desc: 'Atur produk, varian, harga, dan stok barang secara real-time lalu pajang di storefront indah Anda.' },
        { icon: 'point_of_sale', title: 'Kasir Otomatis', desc: 'Sistem menghitung total ongkir dan keranjang otomatis sehingga meminimalisir salah hitung.' },
        { icon: 'insights', title: 'Statistik & Analitik', desc: 'Ketahui jumlah pengunjung, pesanan terbaik, dan total pendapatan langsung dari Dashboard Admin.' }
    ];
    try {
        if (landingSettings?.landing_features_json) {
            featuresList = JSON.parse(landingSettings.landing_features_json);
        }
    } catch (e) {}

    const platformName = landingSettings?.landing_platform_name || 'WA Market';
    const ctaPrimary = landingSettings?.landing_cta_primary_text || 'Buat Toko Gratis';
    const ctaHero = landingSettings?.landing_cta_primary_text || 'Mulai Berjualan — Gratis';
    const demoSlug = landingSettings?.landing_cta_demo_slug || 'tokoindo';


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] font-display text-slate-900 dark:text-slate-100">
            {/* Header/Navbar */}
            <header className="fixed top-0 inset-x-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-40 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {landingSettings?.landing_logo_url ? (
                            <img src={landingSettings.landing_logo_url} alt={platformName} className="h-10 object-contain" />
                        ) : (
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                <Icon name="storefront" size={24} />
                            </div>
                        )}
                        <span className="text-xl font-extrabold tracking-tight hidden sm:block">{platformName}</span>
                    </div>
                    
                    <nav className="hidden md:flex items-center gap-8 font-medium text-slate-600 dark:text-slate-300">
                        <a href="#fitur" className="hover:text-primary transition-colors">Fitur</a>
                        <a href={`/s/${demoSlug}`} className="hover:text-primary transition-colors">Demo</a>
                        <button 
                            onClick={() => setShowRegisterModal(true)}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-full font-bold transition-all hover:scale-105"
                        >
                            {ctaPrimary}
                        </button>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <main>
                <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/10 to-transparent dark:from-primary/20" />
                    <div className="absolute -top-48 -right-48 w-96 h-96 bg-accent-orange/20 blur-3xl rounded-full" />
                    
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-8">
                            {landingSettings?.landing_hero_title ? (
                                <span dangerouslySetInnerHTML={{ __html: landingSettings.landing_hero_title.replace(/\n/g, '<br/>') }} />
                            ) : (
                                <>Platform E-Commerce <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-orange">Berbasis WhatsApp</span></>
                            )}
                        </h1>
                        <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
                            {landingSettings?.landing_hero_subtitle || 'Buka toko online Anda sendiri hari ini. Otomatisasi pesanan, terima pembayaran, dan integrasi kurir pengiriman langsung ke WhatsApp pelanggan.'}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
                            <button 
                                onClick={() => setShowRegisterModal(true)}
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-white text-lg font-bold rounded-full hover:bg-primary-dark shadow-xl shadow-primary/30 transition-all hover:scale-105"
                            >
                                {ctaHero}
                            </button>
                            <a 
                                href={`/s/${demoSlug}`}
                                className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                            >
                                Lihat Toko Demo
                            </a>
                        </div>
                        {landingSettings?.landing_hero_image_url && (
                            <img src={landingSettings.landing_hero_image_url} alt="Hero illustration" className="w-full max-w-4xl mx-auto rounded-3xl shadow-2xl border-4 border-white/50 dark:border-slate-800/50" />
                        )}
                    </div>
                </div>

                {/* Features Section */}
                <div id="fitur" className="py-24 bg-white dark:bg-[#0F172A]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                                {landingSettings?.landing_features_title || 'Fitur Lengkap untuk Bisnis Anda'}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                {landingSettings?.landing_features_subtitle || 'Dirancang khusus untuk mempermudah penjualan online, menghemat waktu kasir, dan memberikan kenyamanan pelanggan.'}
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuresList.map((feat, idx) => (
                                <FeatureCard key={idx} icon={feat.icon} title={feat.title} desc={feat.desc} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 py-12 text-center text-slate-400">
                <div className="flex items-center justify-center gap-2 mb-4">
                    {landingSettings?.landing_logo_url ? (
                        <img src={landingSettings.landing_logo_url} alt={platformName} className="h-8 object-contain opacity-70 grayscale" />
                    ) : (
                        <Icon name="storefront" size={24} className="text-primary" />
                    )}
                    <span className="text-xl font-bold text-white">{platformName}</span>
                </div>
                <p>{landingSettings?.landing_footer_text || `© 2026 ${platformName} Platform. Built with Hono & React.`}</p>
            </footer>

            {/* Register Store Modal */}
            <Modal
                isOpen={showRegisterModal}
                onClose={() => !registerStore.isPending && setShowRegisterModal(false)}
                title="Buka Toko Baru Anda"
                size="md"
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Store Setup */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">1. Identitas Toko</h4>
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Toko *</label>
                            <input
                                required
                                name="storeName"
                                value={formData.storeName}
                                onChange={handleChange}
                                placeholder="Cth: Toko Baju Keren"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL Toko (Slug) *</label>
                            <div className="relative flex items-center">
                                <span className="absolute left-4 text-slate-400 bg-transparent text-sm">wa-market.com/s/</span>
                                <input
                                    required
                                    name="slug"
                                    value={formData.slug}
                                    onChange={(e) => {
                                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                                        setIsSlugManual(true)
                                        setFormData(prev => ({ ...prev, slug: val }))
                                    }}
                                    className="w-full pl-[135px] pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none text-sm font-medium text-primary"
                                />
                                <div className="absolute right-3">
                                    {isCheckingSlug ? (
                                        <Icon name="sync" size={18} className="animate-spin text-slate-400" />
                                    ) : formData.slug.length >= 3 ? (
                                        slugCheck?.available ? (
                                            <Icon name="check_circle" size={18} className="text-green-500" title="Tersedia" />
                                        ) : (
                                            <Icon name="cancel" size={18} className="text-red-500" title="Sudah dipakai" />
                                        )
                                    ) : null}
                                </div>
                            </div>
                            {formData.slug.length > 0 && formData.slug.length < 3 && (
                                <p className="text-xs text-red-500 mt-1">Minimal 3 karakter</p>
                            )}
                            {slugCheck && !slugCheck.available && (
                                <p className="text-xs text-red-500 mt-1">Terpakai! Silakan gunakan slug lain.</p>
                            )}
                        </div>
                    </div>

                    {/* Admin Setup */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-100 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-2">2. Akun Administrator</h4>
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nama Anda *</label>
                            <input
                                required
                                name="adminName"
                                value={formData.adminName}
                                onChange={handleChange}
                                placeholder="Nama lengkap pengelola"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nomor WhatsApp *</label>
                            <input
                                required
                                type="tel"
                                name="adminPhone"
                                value={formData.adminPhone}
                                onChange={(e) => setFormData(p => ({...p, adminPhone: e.target.value.replace(/\D/g, '')}))}
                                placeholder="081234567890"
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">Digunakan untuk login ke Dashboard Admin.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password *</label>
                            <input
                                required
                                type="password"
                                name="adminPassword"
                                value={formData.adminPassword}
                                onChange={handleChange}
                                placeholder="Buat kata sandi yang aman"
                                minLength={6}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={registerStore.isPending || (slugCheck && !slugCheck.available) || formData.slug.length < 3}
                            className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {registerStore.isPending ? (
                                <>
                                    <Icon name="sync" size={20} className="animate-spin" /> Sedang Membangun Toko...
                                </>
                            ) : (
                                <>
                                    <Icon name="rocket_launch" size={20} /> Daftar Sekarang
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

export default LandingPage
