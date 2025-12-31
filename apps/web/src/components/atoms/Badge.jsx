/**
 * Badge - Discount badges, tags
 */
function Badge({ children, variant = 'discount', className = '' }) {
    const variantClasses = {
        discount: 'bg-accent text-white',
        new: 'bg-primary text-white',
        sale: 'bg-accent text-white',
    }

    return (
        <span
            className={`inline-block rounded px-2 py-1 text-xs font-bold uppercase tracking-wider shadow-sm ${variantClasses[variant]} ${className}`}
        >
            {children}
        </span>
    )
}

export default Badge
