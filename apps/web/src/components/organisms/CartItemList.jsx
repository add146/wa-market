import { CartItemCard } from '../molecules'

/**
 * CartItemList - Daftar item keranjang yang scrollable
 */
function CartItemList({ items, onQuantityChange, onRemove }) {
    if (!items || items.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-background-light/50 dark:bg-background-dark">
                <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Keranjang belanja kosong
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-background-light/50 dark:bg-background-dark">
            {items.map((item) => (
                <CartItemCard
                    key={item.id}
                    item={item}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemove}
                />
            ))}
        </div>
    )
}

export default CartItemList
