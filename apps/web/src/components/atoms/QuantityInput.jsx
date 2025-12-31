import Icon from './Icon'

/**
 * QuantityInput - Quantity increment/decrement input
 */
function QuantityInput({ value = 1, onChange, min = 1, max = 99 }) {
    const handleDecrement = () => {
        if (value > min) {
            onChange(value - 1)
        }
    }

    const handleIncrement = () => {
        if (value < max) {
            onChange(value + 1)
        }
    }

    return (
        <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700">
            <button
                type="button"
                onClick={handleDecrement}
                disabled={value <= min}
                className="flex size-10 items-center justify-center rounded-l-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Icon name="remove" size={20} />
            </button>
            <input
                type="text"
                value={value}
                readOnly
                className="h-10 w-12 border-0 bg-transparent text-center text-sm font-medium text-slate-900 focus:ring-0 dark:text-white"
            />
            <button
                type="button"
                onClick={handleIncrement}
                disabled={value >= max}
                className="flex size-10 items-center justify-center rounded-r-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Icon name="add" size={20} />
            </button>
        </div>
    )
}

export default QuantityInput
