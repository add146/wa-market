/**
 * SizeSelector - Size selector radio button
 */
function SizeSelector({ size, name, selected = false, onChange }) {
    return (
        <label className="group relative flex cursor-pointer items-center justify-center rounded-lg border bg-white px-3 py-3 text-sm font-medium uppercase hover:bg-slate-50 focus:outline-none sm:flex-1 dark:bg-surface-dark dark:border-slate-700 dark:text-white dark:hover:bg-slate-800 transition-colors">
            <input
                type="radio"
                name={name}
                value={size}
                checked={selected}
                onChange={onChange}
                className="peer sr-only"
            />
            <span className="peer-checked:text-primary">{size}</span>
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-lg border-2 border-transparent peer-checked:border-primary"
            />
        </label>
    )
}

export default SizeSelector
