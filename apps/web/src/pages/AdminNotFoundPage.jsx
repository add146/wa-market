import { Link } from 'react-router-dom'
import Icon from '../components/atoms/Icon'
import Button from '../components/atoms/Button'

/**
 * AdminNotFoundPage - Admin-styled 404 page
 */
function AdminNotFoundPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-4 bg-background-light dark:bg-background-dark">
            {/* Illustration */}
            <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10">
                    <Icon name="admin_panel_settings" size={64} className="text-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <Icon name="block" size={28} className="text-red-500" />
                </div>
            </div>

            {/* Text Content */}
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 md:text-5xl">
                    404
                </h1>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                    Page Not Found
                </h2>
                <p className="max-w-md text-sm text-slate-500">
                    The admin page you're looking for doesn't exist or has been moved.
                    Please check the URL or return to the dashboard.
                </p>
            </div>

            {/* Action Button */}
            <Link to="/admin">
                <Button
                    variant="primary"
                    size="lg"
                    icon={<Icon name="dashboard" size={18} />}
                >
                    Back to Dashboard
                </Button>
            </Link>

            {/* Quick Links */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-xs text-slate-500">Quick links:</span>
                <Link to="/admin" className="text-xs font-medium text-primary hover:text-primary-dark">
                    Verifications
                </Link>
                <span className="text-xs text-slate-400">•</span>
                <Link to="/admin/orders" className="text-xs font-medium text-primary hover:text-primary-dark">
                    Active Orders
                </Link>
                <span className="text-xs text-slate-400">•</span>
                <Link to="/admin/settings" className="text-xs font-medium text-primary hover:text-primary-dark">
                    Settings
                </Link>
            </div>
        </div>
    )
}

export default AdminNotFoundPage
