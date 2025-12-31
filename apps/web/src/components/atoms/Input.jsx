/**
 * Input - Form input with styling
 */
function Input({
    type = 'text',
    placeholder,
    className = '',
    icon,
    ...props
}) {
    return (
        <label className="flex w-full items-center rounded-lg bg-white dark:bg-[#183028] shadow-sm ring-1 ring-inset ring-gray-200 dark:ring-[#2a4a3e] focus-within:ring-2 focus-within:ring-primary">
            {icon && (
                <div className="flex items-center justify-center pl-3">
                    {icon}
                </div>
            )}
            <input
                type={type}
                placeholder={placeholder}
                className={`w-full border-0 bg-transparent py-2.5 pl-2 pr-4 text-sm text-text-main-light dark:text-white placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:ring-0 focus:outline-none ${className}`}
                {...props}
            />
        </label>
    )
}

export default Input
