import { useState } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import { useProducts, useCategories } from '../hooks'
import { productsApi, uploadApi } from '../api/client'

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'

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
        originalPrice: '',
        stock: '',
        weight: '500',
        categoryId: '',
        images: ''
    })
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const filteredProducts = products.filter(p =>
        p?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const openAddModal = () => {
        setEditingProduct(null)
        setFormData({
            name: '',
            description: '',
            price: '',
            originalPrice: '',
            stock: '',
            weight: '500',
            categoryId: '',
            images: ''
        })
        setImageFile(null)
        setImagePreview('')
        setShowModal(true)
    }

    const openEditModal = (product) => {
        setEditingProduct(product)
        const existingImage = product.image || (Array.isArray(product.images) ? product.images[0] : product.images) || ''
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            originalPrice: product.originalPrice?.toString() || '',
            stock: product.stock?.toString() || '',
            weight: product.weight?.toString() || '500',
            categoryId: product.categoryId || '',
            images: existingImage
        })
        setImageFile(null)
        setImagePreview(existingImage.startsWith('/uploads') ? `${API_BASE}${existingImage}` : existingImage)
        setShowModal(true)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            let imageUrl = formData.images

            // Upload new image if selected
            if (imageFile) {
                setIsUploading(true)
                const uploadRes = await uploadApi.upload(imageFile)
                imageUrl = uploadRes.data.url
                setIsUploading(false)
            }

            const payload = {
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price) || 0,
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
                stock: parseInt(formData.stock) || 0,
                weight: parseInt(formData.weight) || 500,
                categoryId: formData.categoryId || null,
                images: imageUrl ? [imageUrl] : []
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

    const handleDelete = async (id) => {
        if (confirm('Yakin ingin menghapus produk ini?')) {
            try {
                await productsApi.delete(id)
                refetch?.()
            } catch (err) {
                alert('Gagal menghapus produk')
            }
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
                                        <span className="text-xs text-slate-500">
                                            Stok: {product.stock || 0}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="flex-1 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary/10 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product.id)}
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
                            Deskripsi
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Harga *
                            </label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Harga Asli (coret)
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Gambar Produk
                        </label>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">📐 Ukuran ideal: <strong>800 x 800 px</strong> (rasio 1:1, kotak)</p>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary file:text-white file:cursor-pointer"
                        />
                        {imagePreview && (
                            <div className="mt-2">
                                <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg border" />
                            </div>
                        )}
                        {isUploading && <p className="text-sm text-primary mt-1">Mengupload gambar...</p>}
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
        </>
    )
}

export default AdminProductsPage
