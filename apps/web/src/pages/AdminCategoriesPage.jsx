import { useState } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import { useCategories } from '../hooks'
import { categoriesApi } from '../api/client'

/**
 * AdminCategoriesPage - Category management for admins
 */
function AdminCategoriesPage() {
    const categoriesQuery = useCategories()
    const categories = Array.isArray(categoriesQuery?.data)
        ? categoriesQuery.data
        : (categoriesQuery?.data?.data || [])
    const isLoading = categoriesQuery?.isLoading
    const refetch = categoriesQuery?.refetch

    const [showModal, setShowModal] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: '',
        description: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    const openAddModal = () => {
        setEditingCategory(null)
        setFormData({ name: '', slug: '', icon: '', description: '' })
        setShowModal(true)
    }

    const openEditModal = (category) => {
        setEditingCategory(category)
        setFormData({
            name: category.name || '',
            slug: category.slug || '',
            icon: category.icon || '',
            description: category.description || ''
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const payload = {
                name: formData.name,
                slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
                icon: formData.icon || 'category',
                description: formData.description
            }

            if (editingCategory) {
                await categoriesApi.update(editingCategory.id, payload)
            } else {
                await categoriesApi.create(payload)
            }

            setShowModal(false)
            refetch?.()
        } catch (err) {
            alert('Gagal menyimpan kategori: ' + (err.message || 'Unknown error'))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (confirm('Yakin ingin menghapus kategori ini?')) {
            try {
                await categoriesApi.delete(id)
                refetch?.()
            } catch (err) {
                alert('Gagal menghapus kategori')
            }
        }
    }

    return (
        <>
            <AdminHeader
                title="Kelola Kategori"
                subtitle={`${categories.length} kategori`}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Add Button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                        <Icon name="add" size={20} />
                        Tambah Kategori
                    </button>
                </div>

                {/* Categories List */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : categories.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Icon name="category" size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Belum ada kategori</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Icon</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Nama</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Slug</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {categories.map(cat => (
                                    <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                                <Icon name={cat.icon || 'category'} size={24} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                            {cat.name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {cat.slug}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openEditModal(cat)}
                                                className="text-primary hover:text-primary-dark text-sm font-medium mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat.id)}
                                                className="text-red-500 hover:text-red-600 text-sm font-medium"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Category Form Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nama Kategori *
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
                            Slug (URL)
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="otomatis dari nama"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Icon (Material Icon name)
                        </label>
                        <input
                            type="text"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            placeholder="category, phone_iphone, laptop, etc."
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Deskripsi
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
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
                            {isSaving ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    )
}

export default AdminCategoriesPage
