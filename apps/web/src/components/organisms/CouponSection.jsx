import { Icon } from '../atoms'
import { CouponInput } from '../molecules'

/**
 * CouponSection - Kode Kupon section
 */
function CouponSection({
    couponCode,
    onCouponCodeChange,
    onApplyCoupon,
    appliedCoupon,
    savedAmount,
    error,
    isLoading,
}) {
    return (
        <section className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark shadow-sm p-6 lg:p-8">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <Icon name="local_offer" size={24} className="text-accent-orange" />
                <h2 className="text-lg font-bold text-text-main-light dark:text-white">
                    Punya Kode Kupon?
                </h2>
            </div>

            {/* Coupon Input */}
            <CouponInput
                value={couponCode}
                onChange={onCouponCodeChange}
                onApply={onApplyCoupon}
                disabled={isLoading}
            />

            {/* Loading State */}
            {isLoading && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-300 text-sm">
                    <span className="animate-spin">⏳</span>
                    <span>Memvalidasi kupon...</span>
                </div>
            )}

            {/* Error Message */}
            {error && !isLoading && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-sm">
                    <Icon name="error" size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* Success Message */}
            {appliedCoupon && !isLoading && !error && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300 text-sm">
                    <Icon name="check_circle" size={18} />
                    <span>
                        Kode <strong>{appliedCoupon}</strong> berhasil digunakan! Anda hemat {savedAmount}.
                    </span>
                </div>
            )}
        </section>
    )
}

export default CouponSection

