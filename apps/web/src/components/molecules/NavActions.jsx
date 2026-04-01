import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../atoms'
import { CartDropdown } from '../organisms'
import { useCart, useAuth } from '../../context'

/**
 * NavActions - Cart & profile action buttons with responsive dropdown
 */
function NavActions({ cartCount = 0 }) {
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const { itemCount } = useCart()
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const count = itemCount || cartCount

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleLogout = () => {
        logout()
        setIsProfileOpen(false)
        navigate('/')
    }

    const CartIcon = (
        <>
            <Icon name="shopping_cart" className="text-text-main-light dark:text-white" />
            {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white border-2 border-background-light dark:border-background-dark">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </>
    )

    return (
        <div className="flex items-center gap-2 md:gap-4">
            {/* Cart */}
            {isMobile ? (
                <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                    {CartIcon}
                </Link>
            ) : (
                <div className="relative" onMouseEnter={() => setIsCartOpen(true)} onMouseLeave={() => setIsCartOpen(false)}>
                    <button className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                        {CartIcon}
                    </button>
                    {isCartOpen && (
                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in">
                            <CartDropdown />
                        </div>
                    )}
                </div>
            )}

            {/* Profile - Login link or user menu */}
            {user ? (
                <div className="relative" onMouseEnter={() => setIsProfileOpen(true)} onMouseLeave={() => setIsProfileOpen(false)}>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors">
                        <Icon name="person" className="text-primary" />
                    </button>
                    {isProfileOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-2 animate-fade-in">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                            </div>
                            {(user.role === 'admin' || user.role === 'seller') && (
                                <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Icon name="dashboard" size={18} />
                                    Dashboard
                                </Link>
                            )}
                            <Link to="/my-library" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Icon name="library_books" size={18} />
                                Pustaka Saya
                            </Link>
                            <Link to="/my-orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Icon name="receipt_long" size={18} />
                                Pesanan Saya
                            </Link>
                            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Icon name="logout" size={18} />
                                Keluar
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Link to="/login" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors">
                    <Icon name="account_circle" className="text-text-main-light dark:text-white" />
                </Link>
            )}
        </div>
    )
}

export default NavActions
