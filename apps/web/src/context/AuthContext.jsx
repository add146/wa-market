import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/client'

const AuthContext = createContext()

// Role hierarchy: admin > seller > user/customer
const ROLE_LEVELS = {
    user: 1,
    customer: 1,   // Treat customer as user level
    seller: 2,
    admin: 3,
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('auth_token'))
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Check session on mount
    useEffect(() => {
        const checkSession = async () => {
            if (token) {
                try {
                    const response = await authApi.session()
                    if (response.data?.user) {
                        setUser(response.data.user)
                    } else {
                        // Invalid token
                        localStorage.removeItem('auth_token')
                        setToken(null)
                    }
                } catch (err) {
                    console.error('Session check failed:', err)
                    localStorage.removeItem('auth_token')
                    setToken(null)
                }
            }
            setIsLoading(false)
        }
        checkSession()
    }, [token])

    // Login function
    const login = async (phone, password) => {
        setError(null)
        setIsLoading(true)
        try {
            const response = await authApi.login({ phone, password })
            const data = response.data
            if (data.token) {
                localStorage.setItem('auth_token', data.token)
                setToken(data.token)
                setUser(data.user)
                return { success: true, user: data.user }
            }
            throw new Error(data.message || 'Login gagal')
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Login gagal'
            setError(message)
            return { success: false, error: message }
        } finally {
            setIsLoading(false)
        }
    }

    // Register function
    const register = async (userData) => {
        setError(null)
        setIsLoading(true)
        try {
            const response = await authApi.register(userData)
            const data = response.data
            if (data.token) {
                localStorage.setItem('auth_token', data.token)
                setToken(data.token)
                setUser(data.user)
                return { success: true, user: data.user }
            }
            throw new Error(data.message || 'Registrasi gagal')
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Registrasi gagal'
            setError(message)
            return { success: false, error: message }
        } finally {
            setIsLoading(false)
        }
    }

    // Logout function
    const logout = async () => {
        try {
            await authApi.logout()
        } catch (err) {
            console.error('Logout error:', err)
        }
        localStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
    }

    // Check if user has required role
    const hasRole = (requiredRole) => {
        if (!user) return false
        const userLevel = ROLE_LEVELS[user.role] || 0
        const requiredLevel = ROLE_LEVELS[requiredRole] || 0
        return userLevel >= requiredLevel
    }

    // Check if user is authenticated
    const isAuthenticated = !!user

    // Check specific roles
    const isAdmin = user?.role === 'admin'
    const isSeller = user?.role === 'seller' || isAdmin
    const isUser = !!user

    const value = {
        user,
        token,
        isLoading,
        error,
        isAuthenticated,
        isAdmin,
        isSeller,
        isUser,
        login,
        register,
        logout,
        hasRole,
        setError,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
