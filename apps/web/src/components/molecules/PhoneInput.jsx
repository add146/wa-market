/**
 * PhoneInput - Phone number input with +62 prefix
 */
function PhoneInput({
    value,
    onChange,
    placeholder = '812-3456-7890',
    className = '',
    ...props
}) {
    return (
        <div className={`relative ${className}`}>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                +62
            </span>
            <input
                type="tel"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full rounded-lg border border-input-border bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary/20 h-12 pl-12 pr-4 transition-all text-text-main-light dark:text-text-main-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark"
                {...props}
            />
        </div>
    )
}

export default PhoneInput
