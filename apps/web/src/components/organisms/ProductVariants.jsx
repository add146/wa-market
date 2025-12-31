import { ColorSwatch, SizeSelector } from '../atoms'

/**
 * ProductVariants - Color and size selectors combined
 */
function ProductVariants({
    colors = [],
    sizes = [],
    selectedColor,
    selectedSize,
    onColorChange,
    onSizeChange
}) {
    return (
        <div className="space-y-6">
            {/* Color Selector */}
            <div>
                <h3 className="text-sm font-medium text-slate-900 dark:text-white">Warna</h3>
                <div className="mt-3 flex items-center gap-3">
                    {colors.map((color) => (
                        <ColorSwatch
                            key={color.value}
                            color={color.hex}
                            name="color-choice"
                            value={color.value}
                            checked={selectedColor === color.value}
                            onChange={() => onColorChange(color.value)}
                        />
                    ))}
                </div>
            </div>

            {/* Size Selector */}
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">Ukuran</h3>
                    <button className="text-sm font-medium text-primary hover:text-primary-dark transition-colors">
                        Panduan Ukuran
                    </button>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6">
                    {sizes.map((size) => (
                        <SizeSelector
                            key={size}
                            size={size}
                            name="size-choice"
                            selected={selectedSize === size}
                            onChange={() => onSizeChange(size)}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ProductVariants
