import { useState } from 'react'
import { CategoryChip } from '../molecules'

const categories = [
    { id: 'all', label: 'Semua', icon: null },
    { id: 'electronics', label: 'Elektronik', icon: 'devices' },
    { id: 'fashion-pria', label: 'Fashion Pria', icon: 'styler' },
    { id: 'wanita', label: 'Wanita', icon: 'woman' },
    { id: 'makanan', label: 'Makanan', icon: 'restaurant' },
    { id: 'hobi', label: 'Hobi & Mainan', icon: 'sports_esports' },
    { id: 'rumah-tangga', label: 'Rumah Tangga', icon: 'home' },
]

/**
 * CategoryChips - Horizontal scrollable category filters
 */
function CategoryChips({ onCategoryChange }) {
    const [activeCategory, setActiveCategory] = useState('all')

    const handleClick = (categoryId) => {
        setActiveCategory(categoryId)
        onCategoryChange?.(categoryId)
    }

    return (
        <div className="flex w-full flex-col gap-3">
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">
                Kategori Pilihan
            </h3>
            <div className="no-scrollbar flex w-full gap-3 overflow-x-auto pb-2">
                {categories.map((category) => (
                    <CategoryChip
                        key={category.id}
                        label={category.label}
                        icon={category.icon}
                        isActive={activeCategory === category.id}
                        onClick={() => handleClick(category.id)}
                    />
                ))}
            </div>
        </div>
    )
}

export default CategoryChips
