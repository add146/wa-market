import { useState } from 'react'
import Icon from '../atoms/Icon'

/**
 * RejectionModal - Modal for rejection reason and customer message
 */
function RejectionModal({ isOpen, onClose, onConfirm }) {
    const [reason, setReason] = useState('Payment amount does not match')
    const [note, setNote] = useState('')

    const reasons = [
        'Payment amount does not match',
        'Image is blurry / unreadable',
        'Invalid bank account destination',
        'Duplicate receipt detected',
        'Other'
    ]

    if (!isOpen) return null

    const handleConfirm = () => {
        onConfirm?.({ reason, note })
        onClose?.()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-surface-light dark:bg-surface-dark w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
                    <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <Icon name="report_problem" size={20} />
                        Reject Verification
                    </h3>
                    <button onClick={onClose} className="text-red-400 hover:text-red-600">
                        <Icon name="close" size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Reason for Rejection
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 px-3 focus:ring-red-500 focus:border-red-500"
                        >
                            {reasons.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Note to Customer (WhatsApp)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Explain why the payment is rejected..."
                            className="w-full rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 px-3 focus:ring-red-500 focus:border-red-500 h-24 resize-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">This message will be sent automatically via WhatsApp.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
                    >
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    )
}

export default RejectionModal
