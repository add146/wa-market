import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import { useProducts, useCategories } from '../hooks'
import { productsApi, uploadApi } from '../api/client'
import { useToast } from '../context'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

/**
 * AdminProductsPage - Product management for sellers/admins
 */
function AdminProductsPage() {
    const productsQuery = useProducts()
    const categoriesQuery = useCategories()

    const products = Array.isArray(productsQuery?.data)
        ? productsQuery.data
        : (productsQuery?.data?.products || productsQuery?.data?.data || [])
    const categories = Array.isArray(categoriesQuery?.data)
        ? categoriesQuery.data
        : (categoriesQuery?.data?.data || [])

    const isLoading = productsQuery?.isLoading
    const refetch = productsQuery?.refetch

    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        costPrice: '',
        originalPrice: '',
        stock: '',
        weight: '500',
        categoryId: '',
        productType: 'regular',
        digitalType: 'link',
        preorderDays: '0',
        digitalContent: '',
        ebookFileKey: '',
        dpType: 'percentage',
        dpValue: '',
        serviceDuration: '',
        serviceDescription: '',
        requiresShipping: true,
        images: ['', '', ''],
        variants: []
    })
    const [imageFiles, setImageFiles] = useState([null, null, null])
    const [ebookFile, setEbookFile] = useState(null)
    const [imagePreviews, setImagePreviews] = useState(['', '', ''])
    const navigate = useNavigate()
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [productToDelete, setProductToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const toast = useToast()

    const filteredProducts = products.filter(p =>
        p?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const openAddModal = () => {
        setEditingProduct(null)
        setFormData({
            name: '',
            description: '',
            price: '',
            costPrice: '',
            originalPrice: '',
            stock: '',
            weight: '500',
            categoryId: '',
            productType: 'regular',
            digitalType: 'link',
            preorderDays: '0',
            digitalContent: '',
            ebookFileKey: '',
            requiresShipping: true,
            images: ['', '', ''],
            variants: []
        })
        setImageFiles([null, null, null])
        setEbookFile(null)
        setImagePreviews(['', '', ''])
        setShowModal(true)
    }

    const openEditModal = async (product) => {
        setEditingProduct(product)

        // Fetch full product with variants
        try {
            const response = await productsApi.getById(product.id)
            const fullProduct = response.data || response

            // Get existing images (up to 3) - check both image and images fields
            const existingImages = []

            // First try images array
            if (Array.isArray(fullProduct.images) && fullProduct.images.length > 0) {
                fullProduct.images.slice(0, 3).forEach(img => {
                    const url = img.url || img
                    if (url) existingImages.push(url)
                })
            }

            // If no images from array, try single image field
            if (existingImages.length === 0 && fullProduct.image) {
                existingImages.push(fullProduct.image)
            }

            // Pad to 3 slots
            while (existingImages.length < 3) existingImages.push('')

            console.log('Loaded images:', existingImages) // Debug log

            setFormData({
                name: fullProduct.name || '',
                description: fullProduct.description || '',
                price: fullProduct.price?.toString() || '',
                costPrice: fullProduct.costPrice?.toString() || '',
                originalPrice: fullProduct.originalPrice?.toString() || '',
                stock: fullProduct.stock?.toString() || '',
                weight: fullProduct.weight?.toString() || '500',
                categoryId: fullProduct.categoryId || '',
                productType: fullProduct.productType || 'regular',
                digitalType: fullProduct.digitalType || 'link',
                preorderDays: fullProduct.preorderDays?.toString() || '0',
                digitalContent: fullProduct.digitalContent || '',
                ebookFileKey: fullProduct.ebookFileKey || '',
                dpType: fullProduct.dpType || 'percentage',
                dpValue: fullProduct.dpValue?.toString() || '',
                serviceDuration: fullProduct.serviceDuration || '',
                serviceDescription: fullProduct.serviceDescription || '',
                requiresShipping: fullProduct.productType === 'service' ? (fullProduct.requiresShipping ?? false) : true,
                images: existingImages,
                variants: (fullProduct.variants || []).map(v => ({
                    ...v,
                    priceAdjustment: v.priceAdjustment?.toString() || '0',
                    stock: v.stock?.toString() || '0'
                }))
            })
            setImageFiles([null, null, null])
            setEbookFile(null)
            setImagePreviews(existingImages.map(img => {
                if (!img || img === '') return ''
                return img.startsWith('/uploads') ? `${API_BASE}${img}` : img
            }))
            setShowModal(true)
        } catch (err) {
            console.error('Failed to fetch product:', err)
            // Fallback to basic product data
            const existingImage = product.image || (Array.isArray(product.images) ? product.images[0] : product.images) || ''
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price?.toString() || '',
                costPrice: product.costPrice?.toString() || '',
                originalPrice: product.originalPrice?.toString() || '',
                stock: product.stock?.toString() || '',
                weight: product.weight?.toString() || '500',
                categoryId: product.categoryId || '',
                productType: product.productType || 'regular',
                digitalType: product.digitalType || 'link',
                preorderDays: product.preorderDays?.toString() || '0',
                digitalContent: product.digitalContent || '',
                ebookFileKey: product.ebookFileKey || '',
                dpType: product.dpType || 'percentage',
                dpValue: product.dpValue?.toString() || '',
                serviceDuration: product.serviceDuration || '',
                serviceDescription: product.serviceDescription || '',
                requiresShipping: product.productType === 'service' ? (product.requiresShipping ?? false) : true,
                images: [existingImage, '', ''],
                variants: []
            })
            setImageFiles([null, null, null])
            setEbookFile(null)
            setImagePreviews([existingImage.startsWith('/uploads') ? `${API_BASE}${existingImage}` : existingImage, '', ''])
            setShowModal(true)
        }
    }

    const handleImageChange = (index, e) => {
        const file = e.target.files[0]
        if (file) {
            const newFiles = [...imageFiles]
            newFiles[index] = file
            setImageFiles(newFiles)

            const newPreviews = [...imagePreviews]
            newPreviews[index] = URL.createObjectURL(file)
            setImagePreviews(newPreviews)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            // Upload new images if selected
            setIsUploading(true)
            const imageUrls = [...formData.images]

            for (let i = 0; i < 3; i++) {
                if (imageFiles[i]) {
                    const uploadRes = await uploadApi.upload(imageFiles[i])
                    imageUrls[i] = uploadRes.data.url
                }
            }
            setIsUploading(false)

            // Filter out empty image URLs
            const finalImages = imageUrls.filter(url => url && url.trim() !== '')

            let finalEbookFileKey = formData.ebookFileKey;
            
            if (formData.productType === 'digital' && formData.digitalType === 'ebook' && ebookFile) {
                setIsUploading(true)
                const uploadRes = await uploadApi.uploadEbook(ebookFile)
                finalEbookFileKey = uploadRes.data.key
                setIsUploading(false)
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                costPrice: parseFloat(formData.costPrice) || 0,
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
                stock: parseInt(formData.stock) || 0,
                weight: parseInt(formData.weight) || 500,
                categoryId: formData.categoryId || null,
                productType: formData.productType,
                digitalType: formData.productType === 'digital' ? formData.digitalType : null,
                dpType: formData.productType === 'service' ? formData.dpType : null,
                dpValue: formData.productType === 'service' ? parseInt(formData.dpValue) || 0 : null,
                serviceDuration: formData.productType === 'service' ? formData.serviceDuration : null,
                serviceDescription: formData.productType === 'service' ? formData.serviceDescription : null,
                requiresShipping: formData.productType === 'service' ? formData.requiresShipping : true,
                preorderDays: parseInt(formData.preorderDays) || 0,
                digitalContent: formData.digitalContent,
                ebookFileKey: finalEbookFileKey,
                images: finalImages,
                variants: formData.variants.map(v => ({
                    type: v.type,
                    value: v.value,
                    hexCode: v.hexCode || null,
                    stock: parseInt(v.stock) || 0,
                    priceAdjustment: parseInt(v.priceAdjustment) || 0
                }))
            }

            if (editingProduct) {
                await productsApi.update(editingProduct.id, payload)
            } else {
                await productsApi.create(payload)
            }

            setShowModal(false)
            refetch?.()
        } catch (err) {
            console.error('Save error:', err)
            alert('Gagal menyimpan produk: ' + (err.message || 'Unknown error'))
        } finally {
            setIsSaving(false)
            setIsUploading(false)
        }
    }

    // Open delete confirmation modal
    const openDeleteModal = (product) => {
        setProductToDelete(product)
        setShowDeleteModal(true)
    }

    // Confirm delete action
    const confirmDelete = async () => {
        if (!productToDelete) return

        setIsDeleting(true)
        try {
            await productsApi.delete(productToDelete.id)
            toast.success('Produk berhasil dihapus!')
            setShowDeleteModal(false)
            setProductToDelete(null)
            refetch?.()
        } catch (err) {
            console.error('Delete product error:', err)
            const errorMsg = err.response?.data?.error || err.message || 'Gagal menghapus produk'
            toast.error(errorMsg)
        } finally {
            setIsDeleting(false)
        }
    }

    // Get category name by ID
    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.id === categoryId)
        return cat?.name || '-'
    }

    // Get full image URL (handle local uploads)
    const getImageUrl = (product) => {
        const img = product.images?.[0] || product.image || ''
        if (img.startsWith('/uploads')) {
            return `${API_BASE}${img}`
        }
        return img
    }

    return (
        <>
            <AdminHeader
                title="Daftar Produk"
                subtitle={`${products.length} produk`}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Actions */}
                <div className="flex gap-4 mb-6 flex-wrap items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Icon name="search" size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                        <Icon name="add" size={20} />
                        Tambah Produk
                    </button>
                </div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-16 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700">
                        <Icon name="inventory_2" size={48} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-slate-500">Belum ada produk</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div
                                    className="h-40 bg-cover bg-center bg-slate-100 dark:bg-slate-700"
                                    style={{ backgroundImage: `url('${getImageUrl(product)}')` }}
                                />
                                <div className="p-4">
                                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 mb-1">
                                        {product.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-2">{getCategoryName(product.categoryId)}</p>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-primary font-bold">
                                            Rp {(product.price || 0).toLocaleString('id-ID')}
                                        </span>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs text-slate-500">
                                                Stok: {product.productType === 'digital' || product.productType === 'service' ? 'Unlimited' : (product.stock || 0)}
                                            </span>
                                            {product.productType === 'preorder' && (
                                                <span className="text-[10px] px-2 py-0.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                                                    PO {product.preorderDays} Hari
                                                </span>
                                            )}
                                            {product.productType === 'digital' && (
                                                <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                                                    {product.digitalType === 'ebook' ? 'E-book' : product.digitalType === 'course' ? 'LMS Course' : 'Digital'}
                                                </span>
                                            )}
                                            {product.productType === 'service' && (
                                                <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                                    🛠️ Jasa {product.dpValue ? `(DP ${product.dpType === 'percentage' ? product.dpValue + '%' : 'Rp ' + (product.dpValue).toLocaleString('id-ID')})` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="flex-1 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        {product.productType === 'digital' && product.digitalType === 'course' && (
                                            <button
                                                onClick={() => navigate(`/admin/lms-studio/${product.id}`)}
                                                className="flex-1 py-2 px-1 text-sm font-medium text-emerald-600 border border-emerald-500 rounded-lg hover:bg-emerald-50 transition-colors"
                                                title="Materi Kursus"
                                            >
                                                Materi
                                            </button>
                                        )}
                                        <button
                                            onClick={() => openDeleteModal(product)}
                                            className="px-3 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <Icon name="delete" size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Product Form Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingProduct ? 'Edit Produk' : 'Tambah Produk'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nama Produk *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Kategori
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tipe Produk
                            </label>
                            <select
                                value={formData.productType}
                                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="regular">Fisik (Reguler)</option>
                                <option value="preorder">Pre-Order (PO)</option>
                                <option value="digital">Digital (Tanpa Kurir)</option>
                                <option value="service">Jasa / Service (DP Bertahap)</option>
                            </select>
                        </div>
                    </div>

                    {formData.productType === 'preorder' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Waktu Pre-Order (Hari) *
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.preorderDays}
                                onChange={(e) => setFormData({ ...formData, preorderDays: e.target.value })}
                                placeholder="Contoh: 7"
                                required={formData.productType === 'preorder'}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    )}

                    {formData.productType === 'service' && (
                        <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-xl">
                            <h4 className="font-semibold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                                <Icon name="construction" size={20} /> Konfigurasi Jasa & DP
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Tipe DP *
                                    </label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input type="radio" name="dpType" value="percentage" checked={formData.dpType === 'percentage'} onChange={() => setFormData({ ...formData, dpType: 'percentage' })} className="text-purple-600 focus:ring-purple-500" />
                                            Persentase (%)
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                                            <input type="radio" name="dpType" value="fixed" checked={formData.dpType === 'fixed'} onChange={() => setFormData({ ...formData, dpType: 'fixed' })} className="text-purple-600 focus:ring-purple-500" />
                                            Nominal Rupiah
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Nilai DP *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.dpValue}
                                        onChange={(e) => setFormData({ ...formData, dpValue: e.target.value })}
                                        placeholder={formData.dpType === 'percentage' ? "Contoh: 50" : "Contoh: 500000"}
                                        required={formData.productType === 'service'}
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        {formData.dpType === 'percentage' 
                                            ? `Customer akan ditagih DP sebesar ${formData.dpValue || 0}% dari harga produk.` 
                                            : `Customer akan ditagih DP sebesar Rp ${Number(formData.dpValue || 0).toLocaleString('id-ID')}.`}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Estimasi Waktu Pengerjaan
                                </label>
                                <input
                                    type="text"
                                    value={formData.serviceDuration}
                                    onChange={(e) => setFormData({ ...formData, serviceDuration: e.target.value })}
                                    placeholder='Contoh: "7-14 hari kerja" atau "3 Hari"'
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Scope of Work / Deskripsi Jasa
                                </label>
                                <textarea
                                    value={formData.serviceDescription}
                                    onChange={(e) => setFormData({ ...formData, serviceDescription: e.target.value })}
                                    rows={3}
                                    placeholder="Jelaskan detail layanan yang didapatkan customer."
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Pengiriman Fisik & Ongkir
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer mt-2 w-fit">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={formData.requiresShipping}
                                            onChange={(e) => setFormData({ ...formData, requiresShipping: e.target.checked })}
                                        />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${formData.requiresShipping ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.requiresShipping ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                        {formData.requiresShipping ? 'Aktif (Customer bayar ongkir)' : 'Nonaktif (Tanpa pengiriman)'}
                                    </span>
                                </label>
                                <p className="text-xs text-slate-500 mt-1">Aktifkan jika jasa ini memerlukan pengiriman fisik (produk atau dokumen) ke/dari lokasi pelanggan.</p>
                            </div>
                        </div>
                    )}

                    {formData.productType === 'digital' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tipe Digital *
                            </label>
                            <select
                                value={formData.digitalType}
                                onChange={(e) => setFormData({ ...formData, digitalType: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="link">Link Akses / Berkas Eksternal</option>
                                <option value="ebook">E-book (Internal PDF Reader)</option>
                                <option value="course">LMS E-Course (Internal Video)</option>
                            </select>
                        </div>
                    )}

                    {formData.productType === 'digital' && formData.digitalType === 'link' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Konten Digital (Link/Instruksi) *
                            </label>
                            <p className="text-xs text-slate-500 mb-1">Akan dikirimkan otomatis via WhatsApp setelah Order disetujui (Approve).</p>
                            <textarea
                                value={formData.digitalContent}
                                onChange={(e) => setFormData({ ...formData, digitalContent: e.target.value })}
                                rows={2}
                                placeholder="Link Google Drive, Kode Lisensi, dll..."
                                required={formData.digitalType === 'link'}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    )}

                    {formData.productType === 'digital' && formData.digitalType === 'ebook' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Berkas E-book (PDF / EPUB) *
                            </label>
                            <p className="text-xs text-slate-500 mb-2">User akan membaca langsung di dalam website. EPUB mendukung fitur perbesar font yang lebih baik.</p>
                            {formData.ebookFileKey && (
                                <p className="text-sm text-green-600 mb-2 border border-green-200 bg-green-50 p-2 rounded flex items-center gap-2">
                                    <Icon name="check_circle" size={16} /> Berkas sudah tersedia di sistem. Upload baru untuk menimpa.
                                </p>
                            )}
                            <input
                                type="file"
                                accept="application/pdf,application/epub+zip,.epub"
                                onChange={(e) => setEbookFile(e.target.files[0])}
                                required={!formData.ebookFileKey && formData.digitalType === 'ebook'}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    )}

                    {formData.productType === 'digital' && formData.digitalType === 'course' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                            <h4 className="font-semibold flex items-center gap-2 mb-2"><Icon name="info" size={16}/> Informasi Kursus</h4>
                            {editingProduct ? (
                                <div className="flex items-center justify-between gap-3">
                                    <span>Kelola materi kursus (Bab &amp; Video) melalui LMS Studio.</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false)
                                            navigate(`/admin/lms-studio/${editingProduct.id}`)
                                        }}
                                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                    >
                                        <Icon name="play_lesson" size={14} />
                                        Buka Materi
                                    </button>
                                </div>
                            ) : (
                                <span>Setelah produk kursus berhasil disimpan, klik tombol <strong>"Materi"</strong> di daftar produk untuk mengelola materi (Bab dan Video).</span>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Harga Jual (Kosongkan bila gratis)
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                placeholder="0"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Harga HPP
                            </label>
                            <input
                                type="number"
                                value={formData.costPrice}
                                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                                placeholder="Harga kulak"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Harga Coret
                            </label>
                            <input
                                type="number"
                                value={formData.originalPrice}
                                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {formData.productType !== 'digital' && formData.productType !== 'service' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Stok
                                </label>
                                <input
                                    type="number"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        )}
                        {formData.productType !== 'digital' && formData.productType !== 'service' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Berat (gram)
                                </label>
                                <input
                                    type="number"
                                    value={formData.weight}
                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                    placeholder="500"
                                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Gambar Produk (Maks. 3)
                        </label>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">📐 Ukuran ideal: <strong>800 x 800 px</strong> (rasio 1:1, kotak)</p>
                        <div className="grid grid-cols-3 gap-3">
                            {[0, 1, 2].map((idx) => (
                                <div key={idx} className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-2 text-center">
                                    {imagePreviews[idx] ? (
                                        <div className="relative">
                                            <img src={imagePreviews[idx]} alt={`Preview ${idx + 1}`} className="h-24 w-full object-cover rounded-lg" />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newPreviews = [...imagePreviews]
                                                    newPreviews[idx] = ''
                                                    setImagePreviews(newPreviews)
                                                    const newFiles = [...imageFiles]
                                                    newFiles[idx] = null
                                                    setImageFiles(newFiles)
                                                    const newImages = [...formData.images]
                                                    newImages[idx] = ''
                                                    setFormData({ ...formData, images: newImages })
                                                }}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer block">
                                            <div className="h-24 flex flex-col items-center justify-center text-slate-400">
                                                <Icon name="add_photo_alternate" size={28} />
                                                <span className="text-xs mt-1">Gambar {idx + 1}</span>
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageChange(idx, e)}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                        {isUploading && <p className="text-sm text-primary mt-2">Mengupload gambar...</p>}
                    </div>

                    {/* Variants Section */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Variasi Harga
                            </label>
                            <button
                                type="button"
                                onClick={() => setFormData({
                                    ...formData,
                                    variants: [...formData.variants, { type: 'size', value: '', priceAdjustment: '0', stock: '0' }]
                                })}
                                className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20"
                            >
                                + Tambah Variasi
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">Contoh: Size L +Rp 10.000, Size XL +Rp 20.000</p>

                        {formData.variants.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Belum ada variasi harga</p>
                        ) : (
                            <div className="space-y-3">
                                {formData.variants.map((variant, idx) => (
                                    <div key={idx} className="flex gap-2 items-start bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
                                        <div className="flex-1">
                                            <select
                                                value={variant.type}
                                                onChange={(e) => {
                                                    const newVariants = [...formData.variants]
                                                    newVariants[idx].type = e.target.value
                                                    setFormData({ ...formData, variants: newVariants })
                                                }}
                                                className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                            >
                                                <option value="size">Ukuran & Bentuk</option>
                                                <option value="color">Warna</option>
                                                <option value="quality">Kualitas/Fitur</option>
                                                <option value="packaging">Kemasan</option>
                                                <option value="material">Bahan/Komposisi</option>
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                placeholder="Nilai (S/M/L)"
                                                value={variant.value}
                                                onChange={(e) => {
                                                    const newVariants = [...formData.variants]
                                                    newVariants[idx].value = e.target.value
                                                    setFormData({ ...formData, variants: newVariants })
                                                }}
                                                className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                placeholder="+/- Harga"
                                                value={variant.priceAdjustment}
                                                onChange={(e) => {
                                                    const newVariants = [...formData.variants]
                                                    newVariants[idx].priceAdjustment = e.target.value
                                                    setFormData({ ...formData, variants: newVariants })
                                                }}
                                                className="w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newVariants = formData.variants.filter((_, i) => i !== idx)
                                                setFormData({ ...formData, variants: newVariants })
                                            }}
                                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                        >
                                            <Icon name="close" size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {isSaving ? (isUploading ? 'Mengupload...' : 'Menyimpan...') : (editingProduct ? 'Simpan Perubahan' : 'Tambah Produk')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setProductToDelete(null) }}
                title="Hapus Produk"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="delete" size={32} className="text-red-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                        Yakin ingin menghapus produk <strong>"{productToDelete?.name}"</strong>?
                    </p>
                    <p className="text-sm text-slate-500">
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => { setShowDeleteModal(false); setProductToDelete(null) }}
                        disabled={isDeleting}
                        className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? 'Menghapus...' : 'Hapus'}
                    </button>
                </div>
            </Modal>
        </>
    )
}

export default AdminProductsPage
