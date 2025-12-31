/**
 * Icon - Material Symbols Outlined wrapper
 */
function Icon({ name, size = 24, className = '', filled = false }) {
    return (
        <span
            className={`material-symbols-outlined ${className}`}
            style={{
                fontSize: size,
                fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0"
            }}
        >
            {name}
        </span>
    )
}

export default Icon
