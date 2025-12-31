import { Icon } from '../atoms'
import { ShippingOption } from '../molecules'

/**
 * ShippingInfo - Shipping options card
 */
function ShippingInfo({ options = [] }) {
    return (
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-surface-dark dark:shadow-none dark:border dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
                <Icon name="local_shipping" size={24} className="text-slate-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Pengiriman
                </h3>
            </div>
            <div className="space-y-3">
                {options.map((option, index) => (
                    <div key={index}>
                        {index > 0 && (
                            <div className="h-px w-full bg-slate-100 dark:bg-slate-700 mb-3" />
                        )}
                        <ShippingOption
                            name={option.name}
                            estimate={option.estimate}
                            price={option.price}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ShippingInfo
