import { Icon } from '../atoms'

/**
 * ShippingBanner - Banner notifikasi gratis ongkir
 */
function ShippingBanner({ message = "Gratis ongkir untuk pesanan di atas Rp 100rb!" }) {
    return (
        <div className="bg-orange-50 dark:bg-accent/10 px-6 py-3 shrink-0 flex items-center gap-3">
            <Icon name="local_shipping" className="text-accent text-xl shrink-0" />
            <p className="text-accent text-sm font-semibold">{message}</p>
        </div>
    )
}

export default ShippingBanner
