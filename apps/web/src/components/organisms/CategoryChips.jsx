import { CategoryChip } from '../molecules'

/**
 * CategoryChips - Horizontal scrollable category filters (dynamic from API)
 */
function CategoryChips({ categories = [], selectedCategory, onCategoryChange }) {
    // Build category list with "Semua" as first option
    const categoryList = [
        { id: 'all', name: 'Semua', icon: 'apps' },
        ...(categories || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            icon: cat.icon || 'category'
        }))
    ]

    return (
        <div className="flex w-full flex-col gap-3">
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                Kategori Pilihan
            </h3>
            <div className="no-scrollbar flex w-full gap-3 overflow-x-auto pb-2">
                {categoryList.map((category) => (
                    <CategoryChip
                        key={category.id}
                        label={category.name}
                        icon={category.icon}
                        isActive={selectedCategory === category.id || (category.id === 'all' && !selectedCategory)}
                        onClick={() => onCategoryChange?.(category.id)}
                    />
                ))}
            </div>
        </div>
    )
}

export default CategoryChips
