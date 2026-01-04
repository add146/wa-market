import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import api from '../api/client'
import { useToast } from '../context'

/**
 * AdminReviewsPage - Review management for admins
 */
function AdminReviewsPage() {
    const [reviews, setReviews] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingReview, setEditingReview] = useState(null)
    const [formData, setFormData] = useState({
        productId: '',
        reviewerName: '',
        rating: 5,
        comment: ''
    })
    const [isSaving, setIsSaving] = useState(false)

    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [reviewToDelete, setReviewToDelete] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const toast = useToast()

    const fetchReviews = async () => {
        try {
            const response = await api.get('/reviews')
            setReviews(response.data?.data || response.data || [])
        } catch (err) {
            console.log('Failed to fetch reviews')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchReviews()
    }, [])

    const openAddModal = () => {
        setEditingReview(null)
        setFormData({
            productId: '',
            reviewerName: '',
            rating: 5,
            comment: ''
        })
        setShowModal(true)
    }

    const openEditModal = (review) => {
        setEditingReview(review)
        setFormData({
            productId: review.productId || '',
            reviewerName: review.reviewerName || '',
            rating: review.rating || 5,
            comment: review.comment || ''
        })
        setShowModal(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSaving(true)

        try {
            const payload = {
                productId: formData.productId,
                reviewerName: formData.reviewerName,
                rating: parseInt(formData.rating),
                comment: formData.comment
            }

            if (editingReview) {
                await api.put(`/reviews/${editingReview.id}`, payload)
            } else {
                await api.post('/reviews', payload)
            }

            setShowModal(false)
            fetchReviews()
        } catch (err) {
            alert('Gagal menyimpan: ' + (err.response?.data?.error || err.message))
        } finally {
            setIsSaving(false)
        }
    }

    // Open delete confirmation modal
    const openDeleteModal = (review) => {
        setReviewToDelete(review)
        setShowDeleteModal(true)
    }

    // Confirm delete action
    const confirmDelete = async () => {
        if (!reviewToDelete) return

        setIsDeleting(true)
        try {
            await api.delete(`/reviews/${reviewToDelete.id}`)
            toast.success('Ulasan berhasil dihapus!')
            setShowDeleteModal(false)
            setReviewToDelete(null)
            fetchReviews()
        } catch (err) {
            console.error('Delete review error:', err)
            toast.error(err.response?.data?.error || 'Gagal menghapus')
        } finally {
            setIsDeleting(false)
        }
    }

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Icon
                key={i}
                name={i < rating ? 'star' : 'star_border'}
                size={16}
                className={i < rating ? 'text-yellow-500' : 'text-slate-300'}
            />
        ))
    }

    return (
        <>
            <AdminHeader
                title="Kelola Ulasan"
                subtitle={`${reviews.length} ulasan produk`}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Add Button */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
                    >
                        <Icon name="add" size={20} />
                        Tambah Ulasan
                    </button>
                </div>

                {/* Reviews List */}
                {isLoading ? (
                    <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-16 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700">
                        <Icon name="rate_review" size={48} className="mx-auto mb-2 text-slate-400" />
                        <p className="text-slate-500">Belum ada ulasan</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map(review => (
                            <div key={review.id} className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                                            {review.reviewerName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-900 dark:text-white">
                                                {review.reviewerName}
                                            </div>
                                            <div className="flex items-center gap-1 mt-1">
                                                {renderStars(review.rating)}
                                            </div>
                                            <p className="mt-2 text-slate-600 dark:text-slate-300">
                                                {review.comment}
                                            </p>
                                            <p className="mt-2 text-xs text-slate-400">
                                                Produk ID: {review.productId?.slice(0, 8) || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(review)}
                                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                                        >
                                            <Icon name="edit" size={18} />
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(review)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
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

            {/* Review Form Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingReview ? 'Edit Ulasan' : 'Tambah Ulasan'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Product ID *
                        </label>
                        <input
                            type="text"
                            value={formData.productId}
                            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                            required
                            placeholder="UUID produk"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nama Reviewer *
                        </label>
                        <input
                            type="text"
                            value={formData.reviewerName}
                            onChange={(e) => setFormData({ ...formData, reviewerName: e.target.value })}
                            required
                            placeholder="John Doe"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Rating
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: star })}
                                    className="p-1"
                                >
                                    <Icon
                                        name={star <= formData.rating ? 'star' : 'star_border'}
                                        size={28}
                                        className={star <= formData.rating ? 'text-yellow-500' : 'text-slate-300'}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Komentar
                        </label>
                        <textarea
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            rows={3}
                            placeholder="Produk sangat bagus..."
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

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setReviewToDelete(null) }}
                title="Hapus Ulasan"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="delete" size={32} className="text-red-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                        Yakin ingin menghapus ulasan dari <strong>"{reviewToDelete?.reviewerName}"</strong>?
                    </p>
                    <p className="text-sm text-slate-500">
                        Tindakan ini tidak dapat dibatalkan.
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => { setShowDeleteModal(false); setReviewToDelete(null) }}
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

export default AdminReviewsPage
