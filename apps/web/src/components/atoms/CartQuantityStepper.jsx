import Icon from './Icon'

/**
 * CartQuantityStepper - Quantity stepper styled for cart items
 * Features: compact design, primary colored add button, light background
 */
function CartQuantityStepper({ value = 1, onChange, min = 1, max = 99 }) {
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

    const handleInputChange = (e) => {
        const newValue = parseInt(e.target.value, 10)
        if (!isNaN(newValue) && newValue >= min && newValue <= max) {
            onChange(newValue)
        }
    }

    return (
        <div className="flex items-center gap-1 bg-background-light dark:bg-white/10 rounded-lg p-1 border border-transparent focus-within:border-primary/50 transition-colors">
            <button
                type="button"
                onClick={handleDecrement}
                disabled={value <= min}
                className="size-7 flex items-center justify-center rounded-md bg-white dark:bg-white/10 shadow-sm text-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 hover:text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Kurangi jumlah"
            >
                <Icon name="remove" className="text-sm font-bold" />
            </button>
            <input
                type="number"
                value={value}
                onChange={handleInputChange}
                className="w-8 p-0 text-center bg-transparent border-none text-sm font-semibold text-text-main-light dark:text-white focus:ring-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                min={min}
                max={max}
            />
            <button
                type="button"
                onClick={handleIncrement}
                disabled={value >= max}
                className="size-7 flex items-center justify-center rounded-md bg-primary text-white shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Tambah jumlah"
            >
                <Icon name="add" className="text-sm font-bold" />
            </button>
        </div>
    )
}

export default CartQuantityStepper
