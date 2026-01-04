import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import api from '../api/client'
import { useToast } from '../context'

/**
 * AdminCouponsPage - Coupon management for admins
 */
function AdminCouponsPage() {
    const [coupons, setCoupons] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingCoupon, setEditingCoupon] = useState(null)
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minPurchase: '',
        usageLimit: '',
        isActive: true
    })
    const [isSaving, setIsSaving] = useState(false)

    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [couponToDelete, setCouponToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const toast = useToast()

    const fetchCoupons = async () => {
        try {
            const response = await api.get('/coupons')
            setCoupons(response.data?.data || response.data || [])
        } catch (err) {
            console.log('Failed to fetch coupons')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCoupons()
    }, [])

    const openAddModal = () => {
        setEditingCoupon(null)
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            minPurchase: '',
            usageLimit: '',
            isActive: true
        })
        setShowModal(true)
    }

    const openEditModal = (coupon) => {
        setEditingCoupon(coupon)
        setFormData({
            code: coupon.code || '',
            discountType: coupon.discountType || 'percentage',
            discountValue: coupon.discountValue?.toString() || '',
            minPurchase: coupon.minPurchase?.toString() || '',
            usageLimit: coupon.usageLimit?.toString() || '',
            isActive: coupon.isActive ?? true
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const payload = {
                code: formData.code.toUpperCase(),
                discountType: formData.discountType,
                discountValue: parseFloat(formData.discountValue) || 0,
                minPurchase: parseFloat(formData.minPurchase) || 0,
                usageLimit: parseInt(formData.usageLimit) || null,
                isActive: formData.isActive
            }

            if (editingCoupon) {
                await api.put(`/coupons/${editingCoupon.id}`, payload)
            } else {
                await api.post('/coupons', payload)
            }

            setShowModal(false)
            fetchCoupons()
        } catch (err) {
            alert('Gagal menyimpan kupon: ' + (err.response?.data?.error || err.message))
        } finally {
            setIsSaving(false)
        }
    }

    // Open delete confirmation modal
    const openDeleteModal = (coupon) => {
        setCouponToDelete(coupon)
        setShowDeleteModal(true)
    }

    // Confirm delete action
    const confirmDelete = async () => {
        if (!couponToDelete) return

        setIsDeleting(true)
        try {
            await api.delete(`/coupons/${couponToDelete.id}`)
            toast.success('Kupon berhasil dihapus!')
            setShowDeleteModal(false)
            setCouponToDelete(null)
            fetchCoupons()
        } catch (err) {
            console.error('Delete coupon error:', err)
            const errorMsg = err.response?.data?.error || err.message || 'Gagal menghapus kupon'
            toast.error(errorMsg)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <>
            <AdminHeader
                title="Kelola Kupon"
                subtitle={`${coupons.length} kupon tersedia`}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Add Button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                        <Icon name="add" size={20} />
                        Tambah Kupon
                    </button>
                </div>

                {/* Coupons Table */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : coupons.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Icon name="confirmation_number" size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Belum ada kupon</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Kode</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Diskon</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Min. Order</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Penggunaan</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded">
                                                {coupon.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                                            {coupon.discountType === 'percentage'
                                                ? `${coupon.discountValue}%`
                                                : `Rp ${(coupon.discountValue || 0).toLocaleString('id-ID')}`
                                            }
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            Rp {(coupon.minPurchase || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {coupon.isActive ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openEditModal(coupon)}
                                                className="text-primary hover:text-primary-dark text-sm font-medium mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(coupon)}
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

            {/* Coupon Form Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingCoupon ? 'Edit Kupon' : 'Tambah Kupon'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Kode Kupon *
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            required
                            placeholder="DISKON10"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Tipe Diskon
                            </label>
                            <select
                                value={formData.discountType}
                                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="percentage">Persentase (%)</option>
                                <option value="fixed">Nominal (Rp)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nilai Diskon *
                            </label>
                            <input
                                type="number"
                                value={formData.discountValue}
                                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                required
                                placeholder={formData.discountType === 'percentage' ? '10' : '50000'}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Min. Order
                            </label>
                            <input
                                type="number"
                                value={formData.minPurchase}
                                onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                                placeholder="100000"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Max. Penggunaan
                            </label>
                            <input
                                type="number"
                                value={formData.usageLimit}
                                onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                placeholder="Tidak terbatas"
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4 text-primary rounded"
                        />
                        <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300">
                            Kupon Aktif
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setCouponToDelete(null) }}
                title="Hapus Kupon"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="delete" size={32} className="text-red-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                        Yakin ingin menghapus kupon <strong className="font-mono">"{couponToDelete?.code}"</strong>?
                    </p>
                    <p className="text-sm text-slate-500">
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => { setShowDeleteModal(false); setCouponToDelete(null) }}
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

export default AdminCouponsPage
