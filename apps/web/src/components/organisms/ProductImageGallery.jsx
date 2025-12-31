import { useState } from 'react'
import { Icon } from '../atoms'
import { ImageThumbnail } from '../molecules'

/**
 * ProductImageGallery - Main image with zoom button and thumbnail grid
 */
function ProductImageGallery({ images = [] }) {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const currentImage = images[selectedIndex] || images[0]

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 relative group">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${currentImage?.src}')` }}
                    aria-label={currentImage?.alt}
                />
                <button className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/90 dark:bg-black/50 text-slate-700 dark:text-white shadow-lg backdrop-blur hover:bg-white dark:hover:bg-black transition-all">
                    <Icon name="zoom_in" size={24} />
                </button>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <ImageThumbnail
                        key={index}
                        src={image.src}
                        alt={image.alt}
                        active={index === selectedIndex}
                        onClick={() => setSelectedIndex(index)}
                    />
                ))}
            </div>
        </div>
    )
}

export default ProductImageGallery
