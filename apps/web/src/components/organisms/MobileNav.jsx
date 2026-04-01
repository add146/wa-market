import { NavLink } from 'react-router-dom'
import { Icon } from '../atoms'

const navItems = [
    { to: '/', icon: 'home', label: 'Home' },
    { to: '/my-library', icon: 'library_books', label: 'Pustaka' },
    { to: '/my-orders', icon: 'receipt_long', label: 'Pesanan' },
    { to: '/account', icon: 'person', label: 'Akun' },
]

/**
 * MobileNav - Bottom navigation for mobile
 */
function MobileNav() {
    return (
        <div className="fixed bottom-0 left-0 z-50 flex w-full border-t border-[#e7f3ef] dark:border-[#1c3a30] bg-white dark:bg-[#10221c] px-6 py-2 md:hidden justify-between">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                        `flex flex-col items-center gap-1 transition-colors ${isActive
                            ? 'text-primary'
                            : 'text-text-muted-light dark:text-text-muted-dark hover:text-primary'
                        }`
                    }
                >
                    <Icon name={item.icon} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </NavLink>
            ))}
        </div>
    )
}

export default MobileNav
