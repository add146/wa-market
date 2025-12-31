/**
 * Textarea - Multi-line text input
 */
function Textarea({
    placeholder,
    className = '',
    rows = 3,
    ...props
}) {
    return (
        <textarea
            rows={rows}
            placeholder={placeholder}
            className={`w-full rounded-lg border border-input-border bg-background-light dark:bg-background-dark focus:border-primary focus:ring-primary/20 p-4 resize-none text-text-main-light dark:text-text-main-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark ${className}`}
            {...props}
        />
    )
}

export default Textarea
