import { Icon, Input } from '../atoms'

/**
 * SearchBar - Search input with icon
 */
function SearchBar({ placeholder = 'Cari barang di TokoIndo...', value, onChange }) {
    return (
        <div className="flex max-w-[600px] flex-1">
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                icon={<Icon name="search" className="text-text-muted-light dark:text-text-muted-dark" />}
            />
        </div>
    )
}

export default SearchBar
