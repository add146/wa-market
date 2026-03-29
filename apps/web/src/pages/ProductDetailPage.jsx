import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ProductDetailLayout } from '../components/templates'
import { Breadcrumb, PriceDisplay, ProductRating } from '../components/molecules'
import {
    ProductImageGallery,
    ProductVariants,
    ProductActions,
    ProductDescription,
    ShippingInfo
} from '../components/organisms'
import { useProduct, useShippingOptions, useSetting } from '../hooks'
import { useCart, useAuth, useWishlist } from '../context'
import LoadingState from '../components/atoms/LoadingState'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''

// Helper to get full image URL (handle local uploads)
const getImageUrl = (url) => {
    if (url?.startsWith('/uploads')) {
        return `${API_BASE}${url}`
    }
    return url || ''
}

/**
 * ProductDetailPage - Product detail page
 */
function ProductDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    const { isWishlisted, toggleWishlist } = useWishlist()

    // Fetch product data from API
    const { data: product, isLoading, isError, error } = useProduct(id)
    const { data: shippingOptions } = useShippingOptions()
    const { data: whatsappCS } = useSetting('whatsapp_cs')
    const { data: storeName } = useSetting('store_name')

    const [selectedColor, setSelectedColor] = useState('')
    const [selectedSize, setSelectedSize] = useState('')
    const [quantity, setQuantity] = useState(1)

    // Show loading state
    if (isLoading) {
        return <LoadingState />
    }

    // Show error state
    if (isError) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
                        Gagal Memuat Produk
                    </h2>
                    <p className="text-red-600 dark:text-red-300">
                        {error?.message || 'Produk tidak ditemukan'}
                    </p>
                    <a
                        href="/"
                        className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        Kembali ke Beranda
                    </a>
                </div>
            </div>
        )
    }

    if (!product) {
        return <LoadingState />
    }

    // Transform product data for components - handle both image array and single image
    const productImages = product.images?.length > 0
        ? product.images.map(img => ({ src: getImageUrl(img.url || img), alt: img.alt || product.name }))
        : [{ src: getImageUrl(product.image), alt: product.imageAlt || product.name }]

    const productColors = product.variants
        ?.filter(v => v.type === 'color')
        .map(v => ({ value: v.value, hex: v.hexCode || '#000000', priceAdjustment: v.priceAdjustment || 0 })) || []

    const productSizes = product.variants
        ?.filter(v => v.type === 'size')
        .map(v => ({ value: v.value, priceAdjustment: v.priceAdjustment || 0 })) || []

    // Calculate adjusted price based on selected variants
    const getVariantPriceAdjustment = () => {
        let adjustment = 0
        if (selectedColor) {
            const colorVariant = productColors.find(c => c.value === selectedColor)
            if (colorVariant) adjustment += colorVariant.priceAdjustment
        }
        if (selectedSize) {
            const sizeVariant = productSizes.find(s => s.value === selectedSize)
            if (sizeVariant) adjustment += sizeVariant.priceAdjustment
        }
        return adjustment
    }
    const priceAdjustment = getVariantPriceAdjustment()
    const adjustedPrice = product.price + priceAdjustment
    const adjustedOriginalPrice = product.originalPrice ? product.originalPrice + priceAdjustment : null

    const shippingInfoOptions = shippingOptions?.map(opt => ({
        name: opt.name,
        estimate: opt.estimation || 'Estimasi 2-5 hari',
        price: opt.type === 'free' ? 0 : (opt.fixedCost || 15000)
    })) || []

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: product.category?.name || 'Produk', href: '/' },
        { label: product.name, href: '#' }
    ]

    // Calculate rating from reviews
    const rating = product.reviews?.summary?.averageRating || 5
    const reviewCount = product.reviews?.summary?.count || 0

    const { addToCart, showNotification } = useCart()

    const handleAddToCart = () => {
        const variantInfo = [selectedColor, selectedSize].filter(Boolean).join(', ')
        // Create product object with adjusted price for cart
        const productWithAdjustedPrice = {
            ...product,
            price: adjustedPrice,
            originalPrice: adjustedOriginalPrice,
        }
        addToCart(productWithAdjustedPrice, quantity, variantInfo)
    }

    const handleWishlistToggle = async () => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        await toggleWishlist(product.id)
    }

    const handleChatWhatsApp = () => {
        const variantInfo = [selectedColor, selectedSize].filter(Boolean).join(', ')
        const message = encodeURIComponent(
            `Halo, saya tertarik dengan ${product.name}${variantInfo ? ` (${variantInfo})` : ''}`
        )
        const waNumber = whatsappCS || '6281234567890'
        window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank')
    }

    const handleShare = async () => {
        const shareText = `Coba cek produk ini, deh. Harganya Rp${adjustedPrice.toLocaleString('id-ID')} aja!`;
        const shareUrl = window.location.href;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product.name,
                    text: shareText,
                    url: shareUrl
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing', error);
                }
            }
        } else {
            // Fallback for desktop/unsupported browsers
            try {
                await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
                if (showNotification) showNotification('Tautan berhasil disalin!');
                else alert('Tautan berhasil disalin!');
            } catch (error) {
                console.error('Copy failed', error);
            }
        }
    }

    return (
        <ProductDetailLayout brandName={storeName || 'TokoIndo'}>
            {/* Breadcrumbs */}
            <Breadcrumb items={breadcrumbItems} />

            <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
                {/* Image Gallery (Left Column) */}
                <ProductImageGallery images={productImages} />

                {/* Product Info (Right Column) */}
                <div className="mt-4 px-0 sm:mt-16 lg:mt-0">
                    {/* Title & Rating */}
                    <div className="mb-4 sm:mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 sm:pb-6">
                        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-4xl">
                            {product.name}
                        </h1>
                        <ProductRating
                            rating={rating}
                            reviewCount={reviewCount}
                        />

                        {product.productType === 'preorder' && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-sm font-medium border border-orange-200 dark:border-orange-800/30">
                                <span>⏳</span>
                                <span>Produk Pre-Order — Estimasi pengiriman {product.preorderDays} hari setelah pembayaran.</span>
                            </div>
                        )}

                        {product.productType === 'digital' && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium border border-blue-200 dark:border-blue-800/30">
                                <span>📧</span>
                                <span>Produk Digital — Bebas ongkir, dikirim via WhatsApp/Email setelah dikonfirmasi.</span>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <PriceDisplay
                        originalPrice={adjustedOriginalPrice}
                        discountedPrice={adjustedPrice}
                        discountPercent={product.discount}
                    />

                    {/* Variants - only show if available */}
                    {(productColors.length > 0 || productSizes.length > 0) && (
                        <ProductVariants
                            colors={productColors}
                            sizes={productSizes}
                            selectedColor={selectedColor || productColors[0]?.value}
                            selectedSize={selectedSize || productSizes[0]?.value}
                            onColorChange={setSelectedColor}
                            onSizeChange={setSelectedSize}
                        />
                    )}

                    {/* Actions */}
                    <ProductActions
                        stock={product.productType === 'digital' ? 999999 : product.stock} // Fake infinite stock for UI
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                        onAddToCart={handleAddToCart}
                        onChatWhatsApp={handleChatWhatsApp}
                        isWishlisted={isWishlisted(product.id)}
                        onWishlistToggle={handleWishlistToggle}
                        onShare={handleShare}
                    />

                    {/* Info Sections */}
                    <div className="mt-10 space-y-6">
                        <ProductDescription
                            description={product.description}
                            features={product.features || []}
                        />

                        {shippingInfoOptions.length > 0 && (
                            <ShippingInfo options={shippingInfoOptions} />
                        )}
                    </div>
                </div>
            </div>
        </ProductDetailLayout>
    )
}

export default ProductDetailPage
