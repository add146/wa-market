import { ColorSwatch, SizeSelector } from '../atoms'

/**
 * ProductVariants - Color and size selectors combined with price adjustment display
 */
function ProductVariants({
    colors = [],
    sizes = [],
    selectedColor,
    selectedSize,
    onColorChange,
    onSizeChange
}) {
    // Format price adjustment for display
    const formatPriceAdjustment = (adjustment) => {
        if (!adjustment || adjustment === 0) return null
        const sign = adjustment > 0 ? '+' : ''
        return `${sign}Rp ${Math.abs(adjustment).toLocaleString('id-ID')}`
    }

    return (
        <div className="space-y-6">
            {/* Color Selector */}
            {colors.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">Warna</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {colors.map((color) => (
                            <div key={color.value} className="flex flex-col items-center">
                                <ColorSwatch
                                    color={color.hex}
                                    name="color-choice"
                                    value={color.value}
                                    checked={selectedColor === color.value}
                                    onChange={() => onColorChange(color.value)}
                                />
                                {color.priceAdjustment !== 0 && (
                                    <span className="text-xs text-primary mt-1">
                                        {formatPriceAdjustment(color.priceAdjustment)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-3">Ukuran</h3>
                    <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                        {sizes.map((size) => {
                            const sizeValue = typeof size === 'object' ? size.value : size
                            const priceAdj = typeof size === 'object' ? size.priceAdjustment : 0
                            return (
                                <div key={sizeValue} className="text-center">
                                    <SizeSelector
                                        size={sizeValue}
                                        name="size-choice"
                                        selected={selectedSize === sizeValue}
                                        onChange={() => onSizeChange(sizeValue)}
                                    />
                                    {priceAdj !== 0 && (
                                        <span className="text-xs text-primary block mt-1">
                                            {formatPriceAdjustment(priceAdj)}
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ProductVariants
