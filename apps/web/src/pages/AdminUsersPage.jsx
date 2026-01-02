import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon, Modal } from '../components/atoms'
import api from '../api/client'
import { useToast } from '../context'

/**
 * AdminUsersPage - User management for admins
 */
function AdminUsersPage() {
    const toast = useToast()
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedUser, setSelectedUser] = useState(null)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [actionLoading, setActionLoading] = useState(null)

    // Fetch users
    const fetchUsers = async () => {
        try {
            const response = await api.get('/users')
            setUsers(response.data?.users || response.data || [])
        } catch (err) {
            console.error('Failed to fetch users:', err)
            toast.error('Gagal memuat data pengguna')
            setUsers([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            case 'seller': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }
    }

    const handleRoleChange = async (userId, newRole) => {
        if (!confirm(`Ubah role pengguna ini menjadi ${newRole}?`)) return
        setActionLoading(userId)
        try {
            await api.patch(`/users/${userId}/role`, { role: newRole })
            toast.success('Role berhasil diubah!')
            fetchUsers()
        } catch (err) {
            toast.error('Gagal mengubah role')
        } finally {
            setActionLoading(null)
        }
    }

    const openPasswordModal = (user) => {
        setSelectedUser(user)
        setNewPassword('')
        setShowPasswordModal(true)
    }

    const handlePasswordReset = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password minimal 6 karakter')
            return
        }
        setActionLoading(selectedUser.id)
        try {
            await api.patch(`/users/${selectedUser.id}/password`, { newPassword })
            toast.success('Password berhasil direset!')
            setShowPasswordModal(false)
        } catch (err) {
            toast.error('Gagal mereset password')
        } finally {
            setActionLoading(null)
        }
    }

    const handleDelete = async (userId) => {
        if (!confirm('Yakin ingin menghapus pengguna ini?')) return
        setActionLoading(userId)
        try {
            await api.delete(`/users/${userId}`)
            toast.success('Pengguna berhasil dihapus')
            fetchUsers()
        } catch (err) {
            toast.error(err.message || 'Gagal menghapus pengguna')
        } finally {
            setActionLoading(null)
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
                title="Kelola Pengguna"
                subtitle={`${users.length} pengguna terdaftar`}
            />

            <div className="flex-1 overflow-y-auto p-6">
                {/* Users Table */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-500">Loading...</div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <Icon name="group" size={48} className="mx-auto mb-2 opacity-50" />
                            <p>Belum ada pengguna terdaftar</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Terdaftar</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {user.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                            {formatPhone(user.phone)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={user.role || 'customer'}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={actionLoading === user.id}
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getRoleColor(user.role)} disabled:opacity-50`}
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openPasswordModal(user)}
                                                    disabled={actionLoading === user.id}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Icon name="lock" size={14} className="mr-1" />
                                                    Reset Password
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    disabled={actionLoading === user.id}
                                                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    <Icon name="delete" size={14} className="mr-1" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Reset Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title={`Reset Password - ${selectedUser?.name}`}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Password Baru
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowPasswordModal(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400"
                        >
                            Batal
                        </button>
                        <button
                            onClick={handlePasswordReset}
                            disabled={actionLoading}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50"
                        >
                            {actionLoading ? 'Menyimpan...' : 'Reset Password'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default AdminUsersPage
