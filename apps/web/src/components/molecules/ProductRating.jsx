import { Rating } from '../atoms'

/**
 * ProductRating - Star rating with review count link
 */
function ProductRating({ rating = 5, reviewCount = 0, onReviewClick }) {
    return (
        <div className="mt-4 flex items-center gap-4">
            <Rating rating={rating} maxRating={5} size={20} />
            <button
                onClick={onReviewClick}
                className="text-sm font-medium text-primary hover:text-primary-dark hover:underline transition-colors"
            >
                {reviewCount} Ulasan
            </button>
        </div>
    )
}

export default ProductRating
