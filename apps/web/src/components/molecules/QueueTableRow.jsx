/**
 * QueueTableRow - Row in the pending verifications queue table
 */
function QueueTableRow({ order, onVerify }) {
    const { orderId, customer, amount, method, time } = order

    return (
        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
            <td className="px-6 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">{orderId}</td>
            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{customer}</td>
            <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{amount}</td>
            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{method}</td>
            <td className="px-6 py-4 text-slate-500">{time}</td>
            <td className="px-6 py-4 text-right">
                <button
                    onClick={() => onVerify?.(order)}
                    className="text-primary hover:text-primary-dark font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    Verify
                </button>
            </td>
        </tr>
    )
}

export default QueueTableRow
