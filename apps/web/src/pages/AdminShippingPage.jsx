import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import api from '../api/client'

/**
 * AdminShippingPage - Shipping options management for admins
 */
function AdminShippingPage() {
    const [shippingOptions, setShippingOptions] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingOption, setEditingOption] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'fixed',
        cost: '',
        isActive: true
    })
    const [isSaving, setIsSaving] = useState(false)

    const fetchShipping = async () => {
        try {
            const response = await api.get('/shipping-options')
            setShippingOptions(response.data?.data || response.data || [])
        } catch (err) {
            console.log('Failed to fetch shipping')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchShipping()
    }, [])

    const openAddModal = () => {
        setEditingOption(null)
        setFormData({
            name: '',
            description: '',
            type: 'fixed',
            cost: '',
            isActive: true
        })
        setShowModal(true)
    }

    const openEditModal = (option) => {
        setEditingOption(option)
        setFormData({
            name: option.name || '',
            description: option.description || '',
            type: option.type || 'fixed',
            cost: option.cost?.toString() || '',
            isActive: option.isActive ?? true
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                type: formData.type,
                cost: formData.type === 'free' ? 0 : (parseFloat(formData.cost) || 0),
                isActive: formData.isActive
            }

            if (editingOption) {
                await api.put(`/shipping-options/${editingOption.id}`, payload)
            } else {
                await api.post('/shipping-options', payload)
            }

            setShowModal(false)
            fetchShipping()
        } catch (err) {
            alert('Gagal menyimpan: ' + (err.response?.data?.error || err.message))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (id) => {
        if (confirm('Yakin ingin menghapus opsi pengiriman ini?')) {
            try {
                await api.delete(`/shipping-options/${id}`)
                fetchShipping()
            } catch (err) {
                alert('Gagal menghapus')
            }
        }
    }

    const getTypeLabel = (type) => {
        switch (type) {
            case 'api': return { label: 'API (RajaOngkir)', color: 'bg-blue-100 text-blue-800' }
            case 'fixed': return { label: 'Fixed Cost', color: 'bg-orange-100 text-orange-800' }
            case 'free': return { label: 'Gratis', color: 'bg-green-100 text-green-800' }
            default: return { label: type, color: 'bg-gray-100 text-gray-800' }
        }
    }

    return (
        <>
            <AdminHeader
                title="Opsi Pengiriman"
                subtitle={`${shippingOptions.length} opsi pengiriman`}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Add Button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                        <Icon name="add" size={20} />
                        Tambah Opsi
                    </button>
                </div>

                {/* Shipping Options */}
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : shippingOptions.length === 0 ? (
                    <div className="text-center py-16 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700">
                        <Icon name="local_shipping" size={48} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-slate-500">Belum ada opsi pengiriman</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {shippingOptions.map(option => (
                            <div key={option.id} className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <Icon name="local_shipping" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">
                                            {option.name}
                                        </h3>
                                        <p className="text-sm text-slate-500">
                                            {option.description || '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeLabel(option.type).color}`}>
                                        {getTypeLabel(option.type).label}
                                    </span>
                                    {option.type === 'fixed' && (
                                        <span className="text-lg font-bold text-primary">
                                            Rp {(option.cost || 0).toLocaleString('id-ID')}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => openEditModal(option)}
                                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                                    >
                                        <Icon name="edit" size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(option.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                        <Icon name="delete" size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Shipping Form Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingOption ? 'Edit Opsi Pengiriman' : 'Tambah Opsi Pengiriman'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nama *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="JNE Reguler"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Deskripsi
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Estimasi 2-3 hari"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Tipe
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="fixed">Fixed Cost</option>
                            <option value="free">Gratis Ongkir</option>
                            <option value="api">API (RajaOngkir)</option>
                        </select>
                    </div>

                    {formData.type === 'fixed' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Biaya (Rp)
                            </label>
                            <input
                                type="number"
                                value={formData.cost}
                                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                placeholder="15000"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-primary rounded"
                        />
                        <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
                            Aktif
                        </label>
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

export default AdminShippingPage
