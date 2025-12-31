import { Icon } from '../atoms'
import { CourierOption } from '../molecules'

/**
 * CourierSelector - Pilih Kurir section
 */
function CourierSelector({
    selectedCourier,
    onCourierChange,
    couriers = [],
}) {
    return (
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark shadow-sm p-6 lg:p-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border-color dark:border-gray-800">
                <Icon name="local_shipping" size={24} className="text-primary" />
                <h2 className="text-xl font-bold text-text-main-light dark:text-white">
                    Pilih Kurir
                </h2>
            </div>

            {/* Courier Options */}
            <div className="space-y-4">
                {couriers.map((courier) => (
                    <CourierOption
                        key={courier.id}
                        name="courier"
                        value={courier.id}
                        checked={selectedCourier === courier.id}
                        onChange={() => onCourierChange(courier.id)}
                        courierName={courier.name}
                        estimation={courier.estimation}
                        price={courier.price}
                        logoColor={courier.logoColor}
                    />
                ))}
            </div>
        </section>
    )
}

export default CourierSelector
