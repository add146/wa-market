/**
 * OrderItemRow - Single product item in order summary
 */
function OrderItemRow({ item }) {
    const { name, image, quantity, variant, price } = item

    return (
        <div className="flex gap-3">
            <div
                className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0 bg-cover bg-center border border-slate-200 dark:border-slate-700"
                style={{ backgroundImage: `url('${image}')` }}
                aria-label={name}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{name}</p>
                <p className="text-xs text-slate-500 mb-1">Qty: {quantity} • {variant}</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{price}</p>
            </div>
        </div>
    )
}

export default OrderItemRow
