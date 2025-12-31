import { Button } from '../atoms'

/**
 * CouponInput - Coupon code input with apply button
 */
function CouponInput({
    value,
    onChange,
    onApply,
    placeholder = 'Masukkan kode promo',
    className = '',
}) {
    return (
        <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
            <input
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="flex-1 rounded-lg border border-input-border bg-background-light dark:bg-background-dark focus:border-accent-orange focus:ring-accent-orange/20 h-12 px-4 transition-all text-text-main-light dark:text-text-main-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark"
            />
            <Button
                variant="primary"
                onClick={onApply}
                className="py-3 px-6"
            >
                Gunakan
            </Button>
        </div>
    )
}

export default CouponInput
