import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context'
import { Icon } from '../components/atoms'

/**
 * LoginPage - Login page for user/seller/admin
 */
function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login, isLoading, error, setError } = useAuth()

    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Get redirect path from state or default to home
    const from = location.state?.from?.pathname || '/'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)

        // Basic validation
        if (!phone || !password) {
            setError('Nomor WhatsApp dan password harus diisi')
            return
        }

        // Format phone number (add 62 if starts with 0)
        let formattedPhone = phone
        if (phone.startsWith('0')) {
            formattedPhone = '62' + phone.substring(1)
        }

        const result = await login(formattedPhone, password)
        if (result.success) {
            // Redirect based on role
            if (result.user.role === 'admin') {
                navigate('/admin')
            } else if (result.user.role === 'courier') {
                navigate('/courier')
            } else if (result.user.role === 'seller') {
                navigate('/seller')
            } else {
                navigate(from)
            }
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background-light to-accent-orange/10 dark:from-primary/5 dark:via-background-dark dark:to-accent-orange/5 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                            <Icon name="storefront" size={28} className="text-white" />
                        </div>
                        <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            TokoIndo
                        </span>
                    </Link>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Masuk ke akun Anda
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center gap-3">
                                <Icon name="error" size={20} />
                                {error}
                            </div>
                        )}

                        {/* Phone Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Nomor WhatsApp
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    +62
                                </span>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="81234567890"
                                    className="w-full pl-14 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Icon name="login" size={20} />
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-surface-dark text-gray-500">
                                atau
                            </span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <div className="text-center">
                        <p className="text-gray-600 dark:text-gray-400">
                            Belum punya akun?{' '}
                            <Link to="/register" className="text-primary font-semibold hover:underline">
                                Daftar Sekarang
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                    >
                        <Icon name="arrow_back" size={18} />
                        Kembali ke Beranda
                    </Link>
                </div>

                {/* Role Info */}
                <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm">
                    <p className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        🔐 Level Akses:
                    </p>
                    <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                        <li><strong>User:</strong> Belanja & checkout</li>
                        <li><strong>Admin:</strong> Akses penuh dashboard</li>
                        <li><strong>Kurir:</strong> Akses pengantaran</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default LoginPage
