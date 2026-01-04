import { Icon } from '../atoms'

/**
 * ShippingInfo - Shipping price range display
 * Shows min-max shipping cost instead of full list
 */
function ShippingInfo({ options = [] }) {
    // Calculate price range
    const prices = options.map(opt => opt.price || 0).filter(p => p >= 0)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

    // Format price
    const formatPrice = (price) => {
        if (price === 0) return 'Gratis'
        return `Rp ${price.toLocaleString('id-ID')}`
    }

    // Display text
    let priceText = ''
    if (minPrice === 0 && maxPrice === 0) {
        priceText = 'Gratis Ongkir'
    } else if (minPrice === maxPrice) {
        priceText = formatPrice(minPrice)
    } else if (minPrice === 0) {
        priceText = `Gratis - ${formatPrice(maxPrice)}`
    } else {
        priceText = `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`
    }

    return (
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-surface-dark dark:shadow-none dark:border dark:border-slate-800">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon name="local_shipping" size={24} className="text-slate-400" />
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Pengiriman
                    </h3>
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                        {priceText}
                    </p>
                    <p className="text-xs text-slate-500">
                        {options.length} pilihan kurir
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ShippingInfo
