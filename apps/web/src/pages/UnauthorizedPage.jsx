import { Link } from 'react-router-dom'
import { Icon } from '../components/atoms'
import { useAuth } from '../context'

/**
 * UnauthorizedPage - Shown when user doesn't have required role
 */
function UnauthorizedPage() {
    const { user, logout } = useAuth()

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
                <div className="text-8xl mb-6">🚫</div>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                    Akses Ditolak
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Anda tidak memiliki izin untuk mengakses halaman ini.
                    {user && (
                        <span className="block mt-2">
                            Level akun Anda: <strong className="text-primary">{user.role}</strong>
                        </span>
                    )}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors"
                    >
                        <Icon name="home" size={20} />
                        Ke Beranda
                    </Link>
                    {user && (
                        <button
                            onClick={logout}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Icon name="logout" size={20} />
                            Logout
                        </button>
                    )}
                </div>

                {/* Role Info */}
                <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl text-left text-sm">
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Tingkat Akses yang Diperlukan:
                    </p>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                            <strong>User:</strong> Belanja & checkout
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            <strong>Seller:</strong> Dashboard penjual
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full" />
                            <strong>Admin:</strong> Akses penuh sistem
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default UnauthorizedPage
