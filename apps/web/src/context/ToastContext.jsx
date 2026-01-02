import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

/**
 * Toast Provider - Global toast notifications
 */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
    }, [])

    const success = useCallback((message) => showToast(message, 'success'), [showToast])
    const error = useCallback((message) => showToast(message, 'error'), [showToast])
    const info = useCallback((message) => showToast(message, 'info'), [showToast])

    return (
        <ToastContext.Provider value={{ showToast, success, error, info }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-slide-up
                            ${t.type === 'success' ? 'bg-green-500 text-white' : ''}
                            ${t.type === 'error' ? 'bg-red-500 text-white' : ''}
                            ${t.type === 'info' ? 'bg-blue-500 text-white' : ''}
                        `}
                    >
                        <span className="text-xl">
                            {t.type === 'success' && '✓'}
                            {t.type === 'error' && '✕'}
                            {t.type === 'info' && 'ℹ'}
                        </span>
                        <span className="font-medium">{t.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export default ToastContext
