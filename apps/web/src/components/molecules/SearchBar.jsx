import { Icon, Input } from '../atoms'
import { useSetting } from '../../hooks/useSettings'

/**
 * SearchBar - Search input with icon
 */
function SearchBar({ value, onChange }) {
    const { data: storeName } = useSetting('store_name')
    const placeholder = `Cari barang di ${storeName || 'TokoIndo'}...`

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
