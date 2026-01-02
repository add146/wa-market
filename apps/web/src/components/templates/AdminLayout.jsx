import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../organisms/AdminSidebar'
import LoadingState from '../atoms/LoadingState'
import { useSettings } from '../../hooks/useSettings'
import { useOrders } from '../../hooks'

/**
 * AdminLayout - Admin panel layout wrapper
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
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 h-screen overflow-hidden flex flex-col font-display">
            <div className="flex h-full w-full overflow-hidden">
                <AdminSidebar user={user} pendingCount={pendingCount} />
                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                    <Suspense fallback={<LoadingState />}>
                        {children || <Outlet />}
                    </Suspense>
                </main>
            </div>
        </div>
    )
}

export default AdminLayout
