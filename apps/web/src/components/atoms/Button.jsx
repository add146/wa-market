/**
 * Button - Primary, secondary, ghost button variants
 */
function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    icon,
    iconPosition = 'left',
    ...props
}) {
    const baseClasses = 'inline-flex items-center justify-center font-bold transition-colors rounded-lg'

    const variantClasses = {
        primary: 'bg-primary text-white hover:bg-primary-dark shadow-md',
        secondary: 'bg-white dark:bg-card-dark border border-gray-100 dark:border-[#2a4a3e] text-text-main-light dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-[#203d33]',
        ghost: 'hover:bg-primary/10 text-text-main-light dark:text-white',
        whatsapp: 'bg-[#25D366] text-white hover:bg-[#20bd5a] shadow-lg',
    }

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs gap-1',
        md: 'px-5 py-2 text-sm gap-2',
        lg: 'px-6 py-2.5 text-sm gap-2',
        icon: 'h-10 w-10',
        'icon-lg': 'h-14 w-14',
    }

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
        </button>
    )
}

export default Button
