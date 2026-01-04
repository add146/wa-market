import { useState, useRef, useEffect } from 'react'
import SearchInput from '../atoms/SearchInput'
import NotificationButton from '../atoms/NotificationButton'
import { Icon, Modal } from '../atoms'
import { useAuth } from '../../context'
import { Link } from 'react-router-dom'

/**
 * AdminHeader - Top header bar with title, search, notifications, and profile
 */
function AdminHeader({ title = 'Dashboard', subtitle, onSearch }) {
    const { user, logout } = useAuth()
    const [showProfile, setShowProfile] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowProfile(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const openLogoutModal = () => {
        setShowProfile(false)
        setShowLogoutModal(true)
    }

    const confirmLogout = () => {
        setShowLogoutModal(false)
        logout()
    }

    const getRoleLabel = (role) => {
        switch (role) {
            case 'admin': return 'Administrator'
            case 'seller': return 'Penjual'
            default: return 'Pelanggan'
        }
    }

    return (
        <>
            <header className="h-16 flex items-center justify-between px-6 bg-surface-light dark:bg-surface-dark border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h1>
                    {subtitle && (
                        <>
                            <span className="h-4 w-px bg-slate-300 dark:bg-slate-600" />
                            <p className="text-sm text-slate-500">{subtitle}</p>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <SearchInput
                        placeholder="Search Order ID..."
                        onChange={onSearch}
                        className="w-64"
                    />
                    <NotificationButton hasNotification />

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <Icon name="person" size={18} className="text-primary" />
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden md:block">
                                {user?.name || 'User'}
                            </span>
                            <Icon name="expand_more" size={18} className="text-slate-400" />
                        </button>

                        {/* Dropdown Menu */}
                        {showProfile && (
                            <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                                    <p className="font-semibold text-slate-900 dark:text-white">
                                        {user?.name || 'User'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {getRoleLabel(user?.role)} • {user?.phone || '-'}
                                    </p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-1">
                                    <Link
                                        to="/admin"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        onClick={() => setShowProfile(false)}
                                    >
                                        <Icon name="dashboard" size={18} />
                                        Dashboard
                                    </Link>
                                    <Link
                                        to="/admin/settings"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                                        onClick={() => setShowProfile(false)}
                                    >
                                        <Icon name="settings" size={18} />
                                        Pengaturan
                                    </Link>
                                </div>

                                {/* Logout */}
                                <div className="border-t border-slate-200 dark:border-slate-700 pt-1">
                                    <button
                                        onClick={openLogoutModal}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <Icon name="logout" size={18} />
                                        Keluar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Logout Confirmation Modal */}
            <Modal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                title="Keluar dari Akun"
            >
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icon name="logout" size={32} className="text-red-500" />
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 mb-2">
                        Yakin ingin keluar dari akun Anda?
                    </p>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => setShowLogoutModal(false)}
                        className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={confirmLogout}
                        className="flex-1 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
                    >
                        Keluar
                    </button>
                </div>
            </Modal>
        </>
    )
}

export default AdminHeader
