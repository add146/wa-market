import Icon from './Icon'

/**
 * SearchInput - Search input with icon for admin header
 */
function SearchInput({ placeholder = 'Search...', value, onChange, className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <Icon
                name="search"
                className="text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2"
                size={20}
            />
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="pl-10 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none w-full text-slate-800 dark:text-slate-100"
            />
        </div>
    )
}

export default SearchInput
