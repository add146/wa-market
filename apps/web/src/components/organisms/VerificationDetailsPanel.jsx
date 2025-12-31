import Icon from '../atoms/Icon'
import CustomerInfoCard from '../molecules/CustomerInfoCard'
import OrderItemRow from '../molecules/OrderItemRow'

/**
 * VerificationDetailsPanel - Right panel with customer info, order items, and actions
 */
function VerificationDetailsPanel({ verification, onApprove, onReject }) {
    const { customer, orderId, paymentMethod, items, subtotal, shipping, total } = verification

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Customer Info Card */}
            <CustomerInfoCard
                customer={customer}
                orderId={orderId}
                paymentMethod={paymentMethod}
            />

            {/* Order Summary Card */}
            <div className="flex-1 bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                        Order Items ({items.length})
                    </h4>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {items.map((item, index) => (
                        <OrderItemRow key={index} item={item} />
                    ))}
                </div>

                {/* Financials */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-500">Subtotal</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm text-slate-500">Shipping ({shipping.courier})</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{shipping.cost}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-800 dark:text-slate-100">Expected Total</span>
                        <span className="font-bold text-xl text-primary">{total}</span>
                    </div>
                    <div className="mt-2 text-xs text-center text-slate-500 flex items-center justify-center gap-1">
                        <Icon name="info" size={14} />
                        Ensure the proof matches this amount exactly.
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-2 gap-3 h-14">
                <button
                    onClick={onReject}
                    className="flex items-center justify-center gap-2 rounded-lg border-2 border-red-100 hover:border-red-200 hover:bg-red-50 text-red-600 font-semibold transition-colors"
                >
                    <Icon name="close" size={20} />
                    Reject
                </button>
                <button
                    onClick={onApprove}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold shadow-md shadow-primary/20 transition-all"
                >
                    <Icon name="check" size={20} />
                    Approve & Notify
                </button>
            </div>
        </div>
    )
}

export default VerificationDetailsPanel
