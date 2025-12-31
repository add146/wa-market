/**
 * ColorSwatch - Color selector radio button
 */
function ColorSwatch({ color, name, value, checked = false, onChange }) {
    return (
        <label className="relative cursor-pointer">
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                className="peer sr-only"
            />
            <span
                className={`block size-8 rounded-full ring-1 ring-slate-200 ring-offset-1 
                    peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 
                    dark:ring-offset-background-dark transition-all`}
                style={{ backgroundColor: color }}
            />
        </label>
    )
}

export default ColorSwatch
