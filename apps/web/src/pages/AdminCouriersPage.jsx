import { useState } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import { useAdminCouriers, useCreateCourier, useDeleteCourier } from '../hooks'
import { useToast } from '../context'

/**
 * AdminCouriersPage - Manage store's own courier fleet
 */
function AdminCouriersPage() {
    const toast = useToast()
    const { data: couriers = [], isLoading, refetch } = useAdminCouriers()
    const createCourier = useCreateCourier()
    const deleteCourier = useDeleteCourier()
    
    // Add Courier Modal
    const [showAddModal, setShowAddModal] = useState(false)
    const [newName, setNewName] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [newPassword, setNewPassword] = useState('')
    
    // Delete Confirmation Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [courierToAction, setCourierToAction] = useState(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Open Add Modal
    const openAddModal = () => {
        setNewName('')
        setNewPhone('')
        setNewPassword('')
        setShowAddModal(true)
    }

    // Handle Add Courier
    const handleAddCourier = async () => {
        if (!newName || !newPhone || !newPassword) {
            toast.error('Harap lengkapi semua data form')
            return
        }
        if (newPassword.length < 6) {
            toast.error('Password minimal 6 karakter')
            return
        }

        setActionLoading(true)
        try {
            await createCourier.mutateAsync({
                name: newName,
                phone: newPhone,
                password: newPassword
            })
            toast.success('Kurir berhasil ditambahkan!')
            setShowAddModal(false)
        } catch (err) {
            toast.error(err.message || 'Gagal menambahkan kurir')
        } finally {
            setActionLoading(false)
        }
    }

    // Open Delete Modal
    const openDeleteModal = (courier) => {
        setCourierToAction(courier)
        setShowDeleteModal(true)
    }

    // Confirm Delete Action
    const confirmDelete = async () => {
        if (!courierToAction) return
        setActionLoading(true)
        try {
            await deleteCourier.mutateAsync(courierToAction.id)
            toast.success('Kurir berhasil dihapus')
            setShowDeleteModal(false)
            setCourierToAction(null)
        } catch (err) {
            toast.error(err.message || 'Gagal menghapus kurir')
        } finally {
            setActionLoading(false)
        }
    }

    const formatPhone = (phone) => {
        if (!phone) return '-'
        const clean = phone.replace(/\D/g, '')
        if (clean.startsWith('62') && clean.length > 10) {
            return `+${clean.slice(0, 2)} ${clean.slice(2, 5)}-${clean.slice(5, 9)}-${clean.slice(9)}`
        }
        return phone
    }

    return (
        <>
            <AdminHeader
                title="Kelola Kurir Toko"
                subtitle={`${couriers.length} kurir terdaftar`}
                primaryAction={{
                    label: 'Tambah Kurir',
                    icon: 'add',
                    onClick: openAddModal
                }}
            />

            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : couriers.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Icon name="local_shipping" size={32} />
                            </div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">Belum ada kurir</p>
                            <p className="text-sm mt-1 mb-4">Tambahkan kurir untuk menyelesaikan pengantaran lokal toko Anda.</p>
                            <button
                                onClick={openAddModal}
                                className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Tambah Kurir Pertama
                            </button>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurir</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomor WhatsApp</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tgl Terdaftar</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {couriers.map(courier => (
                                    <tr key={courier.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                    <Icon name="two_wheeler" size={20} />
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {courier.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            <a 
                                                href={`https://wa.me/${courier.phone}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                            >
                                                <Icon name="chat" size={16} />
                                                {formatPhone(courier.phone)}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(courier.createdAt).toLocaleDateString('id-ID', {
                                                day: '2-digit', month: 'short', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openDeleteModal(courier)}
                                                disabled={actionLoading}
                                                className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent disabled:opacity-50 inline-flex items-center gap-1"
                                            >
                                                <Icon name="delete" size={16} /> Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add Courier Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Tambah Kurir Internal"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Isikan data berikut. Akun ini hanya dapat digunakan kurir untuk login ke dashboard khusus Kurir.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nama Kurir</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Contoh: Budi Santoso"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nomor WhatsApp</label>
                        <div className="flex">
                            <span className="inline-flex items-center px-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border border-r-0 border-slate-200 dark:border-slate-600 rounded-l-lg">
                                +62
                            </span>
                            <input
                                type="tel"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                                placeholder="812XXXXXXXX (Sbg username login & WA Notif)"
                                className="flex-1 px-4 py-2 rounded-r-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Password Login</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handleAddCourier}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50"
                        >
                            {actionLoading ? 'Menyimpan...' : 'Simpan Kurir'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setCourierToAction(null) }}
                title="Hapus Kurir"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="person_remove" size={32} className="text-red-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                        Yakin ingin menghapus kurir <strong>{courierToAction?.name}</strong>?
                    </p>
                    <p className="text-sm text-slate-500">
                        Mereka tidak akan bisa login lagi ke aplikasi pengantaran.
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => { setShowDeleteModal(false); setCourierToAction(null) }}
                        disabled={actionLoading}
                        className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={confirmDelete}
                        disabled={actionLoading}
                        className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                        {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </Modal>
        </>
    )
}

export default AdminCouriersPage
