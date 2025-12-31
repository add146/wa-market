import { useState, useEffect } from 'react'
import AdminHeader from '../components/organisms/AdminHeader'
import { Icon } from '../components/atoms'
import api from '../api/client'

/**
 * AdminUsersPage - User management for admins
 */
function AdminUsersPage() {
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    // Fetch users (we need to create this endpoint or use existing)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Assuming there's a /users endpoint, or we'll show empty for now
                const response = await api.get('/users')
                setUsers(response.data?.data || response.data || [])
            } catch (err) {
                console.log('Users endpoint not available')
                setUsers([])
            } finally {
                setIsLoading(false)
            }
        }
        fetchUsers()
    }, [])

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800'
            case 'seller': return 'bg-blue-100 text-blue-800'
            default: return 'bg-gray-100 text-gray-800'
        }
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
                            <p>Belum ada data pengguna</p>
                            <p className="text-sm mt-2">Endpoint /api/users mungkin perlu dibuat</p>
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
                                            {user.phone}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleColor(user.role)}`}>
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-primary hover:text-primary-dark text-sm font-medium mr-4">
                                                Edit Role
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    )
}

export default AdminUsersPage
