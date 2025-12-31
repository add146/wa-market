/**
 * ShippingOption - Shipping method with price and estimate
 */
function ShippingOption({ name, estimate, price }) {
    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price)
    }

    return (
        <div className="flex items-start gap-3">
            <div className="flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{estimate}</p>
            </div>
            <span className="text-sm font-semibold text-primary">{formatPrice(price)}</span>
        </div>
    )
}

export default ShippingOption
