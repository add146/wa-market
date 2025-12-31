import Icon from './Icon'

/**
 * NotificationButton - Bell icon with notification indicator
 */
function NotificationButton({ hasNotification = false, onClick }) {
    return (
        <button
            onClick={onClick}
            className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
        >
            <Icon name="notifications" size={24} />
            {hasNotification && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
            )}
        </button>
    )
}

export default NotificationButton
