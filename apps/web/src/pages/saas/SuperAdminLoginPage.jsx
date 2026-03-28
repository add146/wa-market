import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/atoms'
import { useSuperadminLogin } from '../../hooks'

function SuperAdminLoginPage() {
    const navigate = useNavigate()
    const loginMutation = useSuperadminLogin()
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        let formatted = phone.replace(/\D/g, '')
        if (formatted.startsWith('0')) formatted = '62' + formatted.substring(1)

        try {
            await loginMutation.mutateAsync({ phone: formatted, password })
            navigate('/superadmin')
        } catch (err) {
            setError(err.response?.data?.error || 'Login gagal. Pastikan Anda adalah Superadmin.')
        }
    }

    return (
        <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4 font-display">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/20 blur-3xl rounded-full" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/20 blur-3xl rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-3xl rounded-full" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                        <Icon name="admin_panel_settings" size={36} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Superadmin Console</h1>
                    <p className="text-slate-400 mt-1">WA Market Platform Control</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                                <Icon name="error" size={18} />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Nomor WhatsApp</label>
                            <div className="relative">
                                <Icon name="phone" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    required
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="081111111111"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <Icon name="lock" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            {loginMutation.isPending ? (
                                <><Icon name="sync" size={20} className="animate-spin" /> Mengautentikasi...</>
                            ) : (
                                <><Icon name="login" size={20} /> Masuk ke Console</>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    Hanya untuk administrator platform. Akses tidak sah akan dicatat.
                </p>
            </div>
        </div>
    )
}

export default SuperAdminLoginPage
