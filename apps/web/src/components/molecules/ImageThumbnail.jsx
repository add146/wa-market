/**
 * ImageThumbnail - Clickable thumbnail with active state ring
 */
function ImageThumbnail({ src, alt, active = false, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`relative aspect-square overflow-hidden rounded-lg transition-all ${active
                    ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-background-dark'
                    : 'border border-transparent hover:border-primary'
                }`}
        >
            <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${src}')` }}
                aria-label={alt}
            />
        </button>
    )
}

export default ImageThumbnail
