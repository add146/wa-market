import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../organisms/AdminSidebar'
import LoadingState from '../atoms/LoadingState'
import { useSettings } from '../../hooks/useSettings'
import { useOrders } from '../../hooks'

/**
 * AdminLayout - Admin panel layout wrapper (mobile responsive)
 */
function AdminLayout({ children, user }) {
    const { data: settings } = useSettings()
    const ordersQuery = useOrders()
    const orders = ordersQuery?.data?.orders || []

    // Count only pending (unverified) orders
    const pendingCount = orders.filter(o => o?.status === 'pending').length

    // Update browser tab title for admin
    useEffect(() => {
        const storeName = settings?.store_name || 'TokoIndo'
        document.title = `Admin - ${storeName}`
    }, [settings])

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 min-h-screen font-display">
            <div className="flex min-h-screen">
                <AdminSidebar user={user} pendingCount={pendingCount} />
                {/* Main content - add top padding for mobile header */}
                <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden pt-14 lg:pt-0">
                    <Suspense fallback={<LoadingState />}>
                        {children || <Outlet />}
                    </Suspense>
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
