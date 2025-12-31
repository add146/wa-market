import { RadioCard, Icon } from '../atoms'

/**
 * CourierOption - Courier option card with logo, name, estimation, and price
 */
function CourierOption({
    name,
    value,
    checked,
    onChange,
    courierName,
    estimation,
    price,
    logoColor = 'bg-blue-600/20',
}) {
    return (
        <RadioCard
            name={name}
            value={value}
            checked={checked}
            onChange={onChange}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-white p-2 border border-gray-100 flex items-center justify-center">
                        <div className={`w-full h-full ${logoColor} rounded`} />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main-light dark:text-white">
                            {courierName}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                            {estimation}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-primary text-lg">
                        {price}
                    </p>
                </div>
            </div>
        </RadioCard>
    )
}

export default CourierOption
