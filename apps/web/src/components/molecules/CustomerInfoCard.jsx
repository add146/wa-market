import Icon from '../atoms/Icon'

/**
 * CustomerInfoCard - Customer details with WhatsApp contact button
 */
function CustomerInfoCard({ customer, orderId, paymentMethod }) {
    const { name, location, avatar } = customer

    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Icon name="person" size={28} />
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{name}</h3>
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Icon name="location_on" size={16} />
                            {location}
                        </div>
                    </div>
                </div>
                <a
                    href="#"
                    className="flex items-center gap-1 bg-[#25D366]/10 text-[#25D366] px-3 py-1.5 rounded-lg hover:bg-[#25D366]/20 transition-colors text-sm font-medium"
                >
                    <Icon name="chat" size={18} />
                    WhatsApp
                </a>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Order ID</p>
                    <p className="font-mono font-medium text-slate-700 dark:text-slate-300">{orderId}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment Method</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icon name="account_balance" size={16} />
                        {paymentMethod}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default CustomerInfoCard
