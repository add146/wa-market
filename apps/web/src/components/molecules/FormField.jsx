/**
 * FormField - Label + Input wrapper for consistent form styling
 */
function FormField({
    label,
    children,
    className = '',
}) {
    return (
        <label className={`flex flex-col gap-2 ${className}`}>
            <span className="text-sm font-semibold text-text-main-light/80 dark:text-gray-300">
                {label}
            </span>
            {children}
        </label>
    )
}

export default FormField
