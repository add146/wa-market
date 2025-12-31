import { Link } from 'react-router-dom'
import { Icon } from '../atoms'

/**
 * Breadcrumb - Navigation breadcrumb with chevron separators
 */
function Breadcrumb({ items = [] }) {
    return (
        <nav className="mb-8 flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 flex-wrap">
            {items.map((item, index) => (
                <span key={index} className="flex items-center">
                    {index > 0 && (
                        <Icon name="chevron_right" size={16} className="mx-2" />
                    )}
                    {index === items.length - 1 ? (
                        <span className="text-slate-900 dark:text-white font-semibold line-clamp-1">
                            {item.label}
                        </span>
                    ) : (
                        <Link
                            to={item.href}
                            className="hover:text-primary transition-colors"
                        >
                            {item.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    )
}

export default Breadcrumb
