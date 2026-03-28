import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/templates'
import { Icon } from '../components/atoms'
import { useAuth } from '../context'

function AccountPage() {
    const navigate = useNavigate()
    const { user, isAuthenticated, logout } = useAuth()

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login')
        }
    }, [isAuthenticated, navigate])

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    if (!user) return null

    return (
        <MainLayout>
            <div className="mx-auto max-w-sm px-4 py-8 sm:max-w-xl sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                        Profil Akun
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Kelola data profil dan pesanan Anda
                    </p>
                </div>

                {/* Profile Card */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-slate-200 dark:bg-card-dark dark:border-slate-800">
                    <div className="p-6">
                        <div className="flex flex-col items-center sm:flex-row sm:gap-6">
                            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary sm:mb-0">
                                <Icon name="person" size={48} />
                            </div>
                            <div className="text-center sm:text-left">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {user.name}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-1">
                                    {user.phone}
                                </p>
                                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
                                    Member
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Menu */}
                <div className="mt-6 flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/orders')}
                        className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-slate-200 transition-colors hover:bg-slate-50 dark:bg-card-dark dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                <Icon name="receipt_long" size={24} />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">Riwayat Pesanan</span>
                        </div>
                        <Icon name="chevron_right" className="text-slate-400" />
                    </button>
                    
                    <button
                        onClick={() => navigate('/wishlist')}
                        className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-slate-200 transition-colors hover:bg-slate-50 dark:bg-card-dark dark:border-slate-800 dark:hover:bg-slate-800/50"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                <Icon name="favorite" size={24} />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">Wishlist Saya</span>
                        </div>
                        <Icon name="chevron_right" className="text-slate-400" />
                    </button>
                </div>

                {/* Logout */}
                <div className="mt-8">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-card-dark dark:text-slate-300 dark:hover:border-red-900/50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                        <Icon name="logout" size={20} />
                        Keluar Akun
                    </button>
                </div>
            </div>
        </MainLayout>
    )
}

export default AccountPage
