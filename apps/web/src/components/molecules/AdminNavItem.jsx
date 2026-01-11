import { NavLink } from 'react-router-dom'
import Icon from '../atoms/Icon'

/**
 * AdminNavItem - Sidebar navigation item
 */
function AdminNavItem({ to, icon, label, badge, isActive = false, filled = false, onClick }) {
    const baseClasses = "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
    const activeClasses = "bg-primary/10 text-primary dark:text-primary"
    const inactiveClasses = "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"

    const iconStyle = filled ? { fontVariationSettings: "'FILL' 1" } : {}

    const content = (
        <>
            <Icon
                name={icon}
                size={22}
                className={`${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-primary'} transition-colors`}
                style={iconStyle}
            />
            <span className="font-medium text-sm">{label}</span>
            {badge && (
                <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </>
    )

    if (to) {
        return (
            <NavLink
                to={to}
                onClick={onClick}
                className={({ isActive: active }) =>
                    `${baseClasses} ${active ? activeClasses : inactiveClasses}`
                }
            >
                {content}
            </NavLink>
        )
    }

    return (
        <a
            href="#"
            onClick={onClick}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {content}
        </a>
    )
}

export default AdminNavItem
