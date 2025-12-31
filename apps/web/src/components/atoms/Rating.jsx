import Icon from './Icon'

/**
 * Rating - Star rating display component
 */
function Rating({ rating = 5, maxRating = 5, size = 20, className = '' }) {
    return (
        <div className={`flex items-center ${className}`}>
            {[...Array(maxRating)].map((_, index) => (
                <Icon
                    key={index}
                    name="star"
                    size={size}
                    filled={index < rating}
                    className={index < rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                />
            ))}
        </div>
    )
}

export default Rating
