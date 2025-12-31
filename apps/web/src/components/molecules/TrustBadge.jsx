import { Icon } from '../atoms'

/**
 * TrustBadge - Trust indicator badge
 */
function TrustBadge({
    icon,
    label,
    className = '',
}) {
    return (
        <div className={`flex flex-col items-center gap-2 p-3 rounded-lg bg-surface-light dark:bg-surface-dark shadow-sm border border-border-color dark:border-surface-dark ${className}`}>
            <Icon name={icon} size={32} className="text-primary" />
            <span className="text-[10px] uppercase font-bold text-gray-500 text-center">
                {label}
            </span>
        </div>
    )
}

export default TrustBadge
