import Icon from '../atoms/Icon'
import QueueTableRow from '../molecules/QueueTableRow'

/**
 * VerificationQueue - "Up Next in Queue" table
 */
function VerificationQueue({ orders = [], onVerify, onFilter }) {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Up Next in Queue</h3>
                <div className="flex gap-2">
                    <button
                        onClick={onFilter}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg bg-surface-light dark:bg-surface-dark flex items-center gap-2"
                    >
                        <Icon name="filter_list" size={18} />
                        Filter
                    </button>
                </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                            <th className="px-6 py-4">Order ID</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Method</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {orders.map((order, index) => (
                            <QueueTableRow key={index} order={order} onVerify={onVerify} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default VerificationQueue
