import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context'
import LoadingState from './atoms/LoadingState'

/**
 * ProtectedRoute - Protects routes based on authentication and role
 * @param {string} requiredRole - 'user', 'seller', or 'admin'
 * @param {string} redirectTo - Where to redirect if not authorized
 */
function ProtectedRoute({ children, requiredRole = 'user', redirectTo = '/login' }) {
    const { isAuthenticated, hasRole, isLoading } = useAuth()
    const location = useLocation()

    // Show loading while checking auth
    if (isLoading) {
        return <LoadingState />
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />
    }

    // Check role access
    if (!hasRole(requiredRole)) {
        // Redirect based on role
        return <Navigate to="/unauthorized" replace />
    }

    return children
}

export default ProtectedRoute
