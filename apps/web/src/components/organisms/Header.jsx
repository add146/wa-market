import { Logo } from '../atoms'
import { SearchBar, NavActions } from '../molecules'
import { useCart, useSearch } from '../../context'

/**
 * Header - Sticky header with logo, search, and actions
 */
function Header() {
    const { itemCount } = useCart()
    const { searchQuery, setSearchQuery } = useSearch()

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value)
    }

    return (
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e7f3ef] dark:border-[#1c3a30] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 md:px-10">
            <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4">
                <Logo />
                <SearchBar value={searchQuery} onChange={handleSearchChange} />
                <NavActions cartCount={itemCount} />
            </div>
        </header>
    )
}

export default Header

