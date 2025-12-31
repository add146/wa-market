import Icon from '../atoms/Icon'

/**
 * ImageToolbar - Zoom, rotate, download controls for image viewer
 */
function ImageToolbar({ zoom = 100, onZoomIn, onZoomOut, onRotate, onDownload }) {
    return (
        <div className="bg-surface-light dark:bg-surface-dark border border-slate-200 dark:border-slate-700 shadow-lg rounded-full px-4 py-2 flex items-center gap-4">
            <button
                onClick={onZoomOut}
                className="text-slate-500 hover:text-primary transition-colors"
                title="Zoom Out"
            >
                <Icon name="remove_circle_outline" size={24} />
            </button>
            <span className="text-xs font-medium text-slate-500 w-12 text-center">{zoom}%</span>
            <button
                onClick={onZoomIn}
                className="text-slate-500 hover:text-primary transition-colors"
                title="Zoom In"
            >
                <Icon name="add_circle_outline" size={24} />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
            <button
                onClick={onRotate}
                className="text-slate-500 hover:text-primary transition-colors"
                title="Rotate"
            >
                <Icon name="rotate_right" size={24} />
            </button>
            <button
                onClick={onDownload}
                className="text-slate-500 hover:text-primary transition-colors"
                title="Download"
            >
                <Icon name="download" size={24} />
            </button>
        </div>
    )
}

export default ImageToolbar
