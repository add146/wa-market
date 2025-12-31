import Icon from './Icon'

/**
 * LoadingState - Full page loading spinner
 */
function LoadingState({ fullPage = true }) {
    const content = (
        <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            </div>
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark animate-pulse">
                Memuat...
            </p>
        </div>
    )

    if (fullPage) {
        return (
            <div className="flex min-h-[60vh] w-full items-center justify-center">
                {content}
            </div>
        )
    }

    return content
}

export default LoadingState
