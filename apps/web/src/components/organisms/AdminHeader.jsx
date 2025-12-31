import SearchInput from '../atoms/SearchInput'
import NotificationButton from '../atoms/NotificationButton'

/**
 * AdminHeader - Top header bar with title, search, and notifications
 */
function AdminHeader({ title = 'Verification Dashboard', subtitle, onSearch }) {
    return (
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
            </div>
        </header>
    )
}

export default AdminHeader
