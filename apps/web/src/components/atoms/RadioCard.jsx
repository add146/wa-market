/**
 * RadioCard - Radio button styled as selectable card
 */
function RadioCard({
    name,
    value,
    checked,
    onChange,
    children,
    className = '',
}) {
    return (
        <label className={`relative block cursor-pointer group ${className}`}>
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                className="peer sr-only"
            />
            <div className="p-4 rounded-xl border border-input-border bg-background-light dark:bg-background-dark hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary transition-all">
                {children}
            </div>
            <div className="absolute top-4 right-4 hidden peer-checked:block text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                </span>
            </div>
        </label>
    )
}

export default RadioCard
