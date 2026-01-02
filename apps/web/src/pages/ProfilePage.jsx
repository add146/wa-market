import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/atoms'
import { useAuth } from '../context'

/**
 * ProfilePage - Simple user profile page
 */
function ProfilePage() {
    const { user, logout } = useAuth()

    const handleLogout = () => {
        if (confirm('Yakin ingin keluar?')) {
            logout()
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

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Administrator'
            case 'seller': return 'Penjual'
            case 'customer': return 'Pelanggan'
            default: return role
        }
    }

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
            case 'seller': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
                <div className="text-center">
                    <Icon name="person" size={64} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4">Silakan login untuk melihat profil</p>
                    <Link
                        to="/login"
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-color dark:border-surface-dark px-4 sm:px-8 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <Link
                        to="/"
                        className="flex items-center gap-2 text-text-main-light dark:text-white hover:text-primary transition-colors"
                    >
                        <Icon name="arrow_back" size={24} />
                        <span className="font-medium">Kembali</span>
                    </Link>
                    <h1 className="text-xl font-bold text-text-main-light dark:text-white">
                        Profil Saya
                    </h1>
                    <div className="w-20" />
                </div>
            </header>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-4 py-8">
                {/* Profile Card */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark overflow-hidden mb-6">
                    {/* Avatar & Name */}
                    <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon name="person" size={48} className="text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {user.name}
                        </h2>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                        </span>
                    </div>

                    {/* Info */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <Icon name="phone" size={20} className="text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">No. WhatsApp</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {formatPhone(user.phone)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                                <Icon name="calendar_today" size={20} className="text-gray-600 dark:text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Bergabung Sejak</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {user.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })
                                        : '-'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    {(user.role === 'admin' || user.role === 'seller') && (
                        <Link
                            to="/admin"
                            className="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark hover:border-primary transition-colors"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Icon name="dashboard" size={20} className="text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 dark:text-white">Dashboard Admin</p>
                                <p className="text-sm text-gray-500">Kelola toko Anda</p>
                            </div>
                            <Icon name="chevron_right" size={20} className="text-gray-400" />
                        </Link>
                    )}

                    <Link
                        to="/admin/orders"
                        className="flex items-center gap-4 p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark hover:border-primary transition-colors"
                    >
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="receipt_long" size={20} className="text-orange-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">Pesanan Saya</p>
                            <p className="text-sm text-gray-500">Lihat riwayat pesanan</p>
                        </div>
                        <Icon name="chevron_right" size={20} className="text-gray-400" />
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                            <Icon name="logout" size={20} className="text-red-600" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="font-medium text-red-600">Keluar</p>
                            <p className="text-sm text-red-500/70">Logout dari akun</p>
                        </div>
                    </button>
                </div>
            </main>
        </div>
    )
}

export default ProfilePage
