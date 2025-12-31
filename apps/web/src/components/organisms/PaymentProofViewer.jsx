import { useState } from 'react'
import Icon from '../atoms/Icon'
import ImageToolbar from '../molecules/ImageToolbar'

/**
 * PaymentProofViewer - Image viewer panel for payment proof
 */
function PaymentProofViewer({ imageSrc, label = 'Payment Proof' }) {
    const [zoom, setZoom] = useState(100)
    const [rotation, setRotation] = useState(0)

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
    const handleRotate = () => setRotation(prev => (prev + 90) % 360)
    const handleDownload = () => {
        window.open(imageSrc, '_blank')
    }

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow-sm relative group">
            {/* Label Badge */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Icon name="image" size={14} />
                {label}
            </div>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center bg-slate-900 p-8 overflow-hidden relative">
                <img
                    src={imageSrc}
                    alt={label}
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm transition-transform duration-300"
                    style={{
                        transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
                    }}
                />
            </div>

            {/* Toolbar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                <ImageToolbar
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onRotate={handleRotate}
                    onDownload={handleDownload}
                />
            </div>
        </div>
    )
}

export default PaymentProofViewer
