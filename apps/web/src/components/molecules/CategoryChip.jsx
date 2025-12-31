import { Icon } from '../atoms'

/**
 * CategoryChip - Category filter button
 */
function CategoryChip({ label, icon, isActive = false, onClick }) {
    const baseClasses = 'flex h-10 shrink-0 items-center justify-center rounded-lg px-5 text-sm font-medium transition-all active:scale-95'

    const activeClasses = 'bg-primary text-white shadow-md font-bold'
    const inactiveClasses = 'bg-white dark:bg-card-dark border border-gray-100 dark:border-[#2a4a3e] text-text-main-light dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-[#203d33]'

    return (
        <button
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${icon ? 'gap-2' : ''}`}
            onClick={onClick}
        >
            {icon && <Icon name={icon} size={18} />}
            {label}
        </button>
    )
}

export default CategoryChip
