/**
 * Select - Dropdown select component
 */
function Select({
    children,
    className = '',
    placeholder,
    ...props
}) {
    return (
        <select
            className={`w-full rounded-lg border border-input-border bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary/20 h-12 px-4 cursor-pointer text-text-main-light dark:text-text-main-dark ${className}`}
            {...props}
        >
            {placeholder && (
                <option disabled value="">
                    {placeholder}
                </option>
            )}
            {children}
        </select>
    )
}

export default Select
