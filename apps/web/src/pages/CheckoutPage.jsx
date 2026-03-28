import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckoutPageLayout } from '../components/templates'
import {
    CouponSection,
    OrderSummary,
    TrustBadges,
} from '../components/organisms'
import { Icon } from '../components/atoms'
import { useCreateOrder, useValidateCoupon, useSetting } from '../hooks'
import api, { rajaongkirApi, productsApi, paymentApi } from '../api/client'
import { useCart, useAuth } from '../context'

/**
 * CheckoutPage - Main checkout page with RajaOngkir Direct Search
 * Note: RajaOngkir V2 only supports /destination/province and /destination/domestic-destination (search)
 * Step-by-step city/subdistrict endpoints don't exist in V2
 */
function CheckoutPage() {
    const navigate = useNavigate()
    const { items: cartItems, clearCart } = useCart()
    const { user } = useAuth()
    const { data: whatsappKasir } = useSetting('whatsapp_kasir')
    const { data: rajaongkirEnabled, isLoading: loadingRajaongkirSetting } = useSetting('rajaongkir_enabled')

    // Check if RajaOngkir is enabled
    const isRajaOngkirEnabled = rajaongkirEnabled === 'true' || rajaongkirEnabled === true

    // Payment gateway config
    const { data: paymentGatewayEnabled } = useSetting('payment_gateway_enabled')
    const { data: paymentProvider } = useSetting('payment_provider')
    const isPaymentGatewayEnabled = paymentGatewayEnabled === 'true' || paymentGatewayEnabled === true

    // Order mutation
    const createOrder = useCreateOrder()
    const validateCoupon = useValidateCoupon()

    // Form state - prefill from logged-in user
    const [recipientName, setRecipientName] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')

    // Auto-fill form if user is logged in
    useEffect(() => {
        if (user) {
            if (user.name && !recipientName) {
                setRecipientName(user.name)
            }
            if (user.phone && !phone) {
                // Remove leading 62 if present to match phone input format
                const userPhone = user.phone.replace(/^62/, '')
                setPhone(userPhone)
            }
        }
    }, [user])

    // Direct Search state for destination
    const [destinationSearch, setDestinationSearch] = useState('')
    const [destinationResults, setDestinationResults] = useState([])
    const [selectedDestination, setSelectedDestination] = useState(null)
    const [showDestinationResults, setShowDestinationResults] = useState(false)
    const [loadingDestinationSearch, setLoadingDestinationSearch] = useState(false)

    // Shipping/Courier state
    const [couriers, setCouriers] = useState([])
    const [selectedCourier, setSelectedCourier] = useState(null)
    const [isLoadingShipping, setIsLoadingShipping] = useState(false)
    const [shippingError, setShippingError] = useState('')

    // Coupon state
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [couponDiscount, setCouponDiscount] = useState(0)
    const [couponError, setCouponError] = useState('')

    // Error state
    const [submitError, setSubmitError] = useState('')

    // Payment method state
    const [paymentMethod, setPaymentMethod] = useState('whatsapp') // 'whatsapp' | 'xendit' | 'midtrans'

    // Shipping discount state
    const [shippingDiscountOptions, setShippingDiscountOptions] = useState([])
    const [fixedCostOptions, setFixedCostOptions] = useState([])
    const [shippingDiscount, setShippingDiscount] = useState(0)

    // Shipping type: 'own_courier' (kurir sendiri) or 'expedition' (jasa paket)
    const [shippingType, setShippingType] = useState('expedition')

    // GPS Location state (for own courier)
    const [gpsLocation, setGpsLocation] = useState(null) // { lat, lng }
    const [gpsLoading, setGpsLoading] = useState(false)
    const [gpsError, setGpsError] = useState('')

    // Enriched cart items with fresh weights from API
    const [productWeights, setProductWeights] = useState({})

    // Fetch fresh product weights on mount
    useEffect(() => {
        const fetchProductWeights = async () => {
            if (cartItems.length === 0) return

            try {
                // Get unique product IDs
                const productIds = [...new Set(cartItems.map(item => item.productId))]
                const weights = {}

                // Fetch each product to get fresh weight
                for (const productId of productIds) {
                    try {
                        const response = await productsApi.getById(productId)
                        if (response.data?.weight) {
                            weights[productId] = response.data.weight
                        }
                    } catch (err) {
                        console.log('Could not fetch weight for product:', productId)
                    }
                }

                setProductWeights(weights)
            } catch (error) {
                console.error('Error fetching product weights:', error)
            }
        }

        fetchProductWeights()
    }, [cartItems])

    // Calculate subtotal from cart
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    // Use fresh weights from API if available, otherwise fallback to cart item weight or 500g
    const totalWeight = cartItems.reduce((sum, item) => {
        const weight = productWeights[item.productId] || item.weight || 500
        return sum + (weight * item.quantity)
    }, 0)

    // Shipping cost from selected courier (own courier = free)
    const shippingCost = shippingType === 'own_courier' ? 0 : (selectedCourier?.cost || 0)
    const uniqueCode = 123
    const total = subtotal - couponDiscount + shippingCost - shippingDiscount + uniqueCode

    // Fetch shipping options to get discount/potongan ongkir and fixed cost options
    useEffect(() => {
        const fetchShippingOptions = async () => {
            try {
                const response = await api.get('/shipping-options')
                const options = response.data?.data || response.data || []
                // Filter 'free' type (potongan ongkir)
                const discountOptions = options.filter(opt => opt.type === 'free' && opt.isActive)
                setShippingDiscountOptions(discountOptions)
                // Filter 'fixed' type (fixed cost shipping)
                const fixedOptions = options.filter(opt => opt.type === 'fixed' && opt.isActive)
                setFixedCostOptions(fixedOptions)
            } catch (err) {
                console.log('Could not fetch shipping options:', err)
            }
        }
        fetchShippingOptions()
    }, [])

    // Calculate shipping discount based on subtotal
    useEffect(() => {
        if (shippingDiscountOptions.length === 0 || !selectedCourier) {
            setShippingDiscount(0)
            return
        }

        // Find the best applicable discount
        let bestDiscount = 0
        for (const option of shippingDiscountOptions) {
            const minPurchase = option.minPurchaseForFree || 0
            const discountAmount = option.fixedCost || 0 // Using fixedCost for discount amount

            if (subtotal >= minPurchase) {
                // If discountAmount is 0, it means free shipping
                if (discountAmount === 0) {
                    bestDiscount = Math.max(bestDiscount, shippingCost)
                } else {
                    bestDiscount = Math.max(bestDiscount, Math.min(discountAmount, shippingCost))
                }
            }
        }
        setShippingDiscount(bestDiscount)
    }, [shippingDiscountOptions, subtotal, shippingCost, selectedCourier])

    // Debounced destination search
    const searchDestination = useCallback(async (keyword) => {
        if (keyword.length < 3) {
            setDestinationResults([])
            return
        }

        setLoadingDestinationSearch(true)
        try {
            const response = await rajaongkirApi.searchDestination(keyword)
            setDestinationResults(response.data?.data || [])
        } catch (error) {
            console.error('Search error:', error)
            setDestinationResults([])
        } finally {
            setLoadingDestinationSearch(false)
        }
    }, [])

    // Effect for destination search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (destinationSearch && !selectedDestination) {
                searchDestination(destinationSearch)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [destinationSearch, searchDestination, selectedDestination])

    // Handle destination select
    const handleSelectDestination = (dest) => {
        setSelectedDestination(dest)
        setDestinationSearch(dest.label)
        setShowDestinationResults(false)
        setCouriers([])
        setSelectedCourier(null)
    }

    // Calculate shipping when destination is selected
    const calculateShipping = async () => {
        if (!selectedDestination) return

        setIsLoadingShipping(true)
        setShippingError('')
        setCouriers([])

        try {
            // Use id if available, fallback to subdistrict_id for compatibility
            const destinationId = selectedDestination.id || selectedDestination.subdistrict_id
            if (!destinationId) {
                setShippingError('ID tujuan tidak ditemukan. Silakan pilih ulang tujuan pengiriman.')
                setIsLoadingShipping(false)
                return
            }

            const response = await rajaongkirApi.calculateCost({
                destination: destinationId,
                weight: totalWeight || 1000
            })

            if (response.data?.data && response.data.data.length > 0) {
                // RajaOngkir V2 returns flat array: {name, code, service, description, cost, etd}
                const courierOptions = response.data.data.map(item => ({
                    id: `${item.code}-${item.service}`,
                    code: item.code,
                    name: item.name,
                    service: item.service,
                    description: item.description,
                    cost: item.cost,
                    etd: item.etd,
                }))
                setCouriers(courierOptions)
            } else {
                setShippingError('Tidak ada kurir tersedia untuk tujuan ini')
            }
        } catch (error) {
            setShippingError(error.message || 'Gagal menghitung ongkir. Pastikan API Key dan Kota Asal sudah diisi di Settings.')
        } finally {
            setIsLoadingShipping(false)
        }
    }

    const handleBack = (e) => {
        e.preventDefault()
        navigate('/cart')
    }

    const handleApplyCoupon = async () => {
        if (!couponCode) return
        setCouponError('')

        try {
            const result = await validateCoupon.mutateAsync({
                code: couponCode.toUpperCase(),
                subtotal
            })

            if (result.valid) {
                setAppliedCoupon(result.coupon.code)
                setCouponDiscount(result.discount)
            }
        } catch (error) {
            setCouponError(error.message || 'Kode kupon tidak valid')
            setAppliedCoupon(null)
            setCouponDiscount(0)
        }
    }

    const handleCheckout = async () => {
        setSubmitError('')

        if (!recipientName || !phone || !address) {
            setSubmitError('Harap lengkapi semua data penerima')
            return
        }

        // Validation differs by shipping type
        if (shippingType === 'own_courier') {
            // For own courier, GPS or address is enough, no courier selection needed
            if (!gpsLocation && !address) {
                setSubmitError('Harap bagikan lokasi GPS atau isi alamat lengkap untuk kurir sendiri')
                return
            }
        } else {
            if (!selectedCourier) {
                setSubmitError('Harap pilih kurir pengiriman')
                return
            }
            // Only require destination for RajaOngkir couriers (not fixed cost)
            if (!selectedCourier.isFixed && !selectedDestination) {
                setSubmitError('Harap pilih tujuan pengiriman untuk kurir RajaOngkir')
                return
            }
        }
        
        if (paymentMethod === 'cod' && shippingType !== 'own_courier') {
            setSubmitError('Pembayaran COD (Bayar di Tempat) hanya tersedia untuk Kurir Toko')
            return
        }

        try {
            const orderData = {
                recipientName,
                recipientPhone: `62${phone}`,
                province: selectedDestination?.province_name || '',
                city: selectedDestination?.city_name || '',
                district: selectedDestination?.subdistrict_name || '',
                address,
                shippingType,
                latitude: gpsLocation?.lat?.toString() || '',
                longitude: gpsLocation?.lng?.toString() || '',
                shippingOptionId: selectedCourier?.id || null,
                courierName: shippingType === 'own_courier'
                    ? 'Kurir Toko'
                    : `${selectedCourier?.name || 'Manual'} - ${selectedCourier?.service || ''}`,
                shippingCost: shippingType === 'own_courier' ? 0 : (selectedCourier?.cost || 0),
                couponCode: appliedCoupon,
                guestPhone: `62${phone}`,
                paymentMethod,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    variantInfo: item.variantInfo || '',
                })),
            }

            const result = await createOrder.mutateAsync(orderData)

            // Handle payment based on selected method
            if (paymentMethod === 'whatsapp' || paymentMethod === 'cod') {
                // Traditional WhatsApp flow or COD
                if (result.whatsappUrl) {
                    window.open(result.whatsappUrl, '_blank')
                }
                clearCart()
                const msg = paymentMethod === 'cod' 
                    ? `✅ Pesanan berhasil dibuat!\n\nNo. Order: ${result.order.orderNumber}\nTotal: Rp ${result.order.total.toLocaleString('id-ID')}\n\nPesanan Anda menggunakan metode COD (Bayar di Tempat). Harap siapkan uang tunai sejumlah Total Bayar untuk diberikan ke Kurir Toko.`
                    : `✅ Pesanan berhasil dibuat!\n\nNo. Order: ${result.order.orderNumber}\nTotal: Rp ${result.order.total.toLocaleString('id-ID')}\n\nSilakan lanjutkan pembayaran via WhatsApp`;
                alert(msg)
                navigate('/')
            } else {
                // Online payment (Xendit / Midtrans)
                try {
                    const payResult = await paymentApi.create(result.order.id, paymentMethod)
                    const payData = payResult.data
                    if (payData.paymentUrl) {
                        clearCart()
                        // Redirect to payment gateway
                        window.location.href = payData.paymentUrl
                    } else {
                        clearCart()
                        navigate(`/payment-status/${result.order.id}`)
                    }
                } catch (payErr) {
                    console.error('Payment create error:', payErr)
                    // Order already created, redirect to status page
                    clearCart()
                    navigate(`/payment-status/${result.order.id}`)
                }
            }
        } catch (error) {
            console.error('Checkout error:', error, error.details)
            // Show more detailed error for debugging
            let errorMsg = error.message || 'Gagal membuat pesanan. Silakan coba lagi.'
            if (error.details && Array.isArray(error.details)) {
                errorMsg = error.details.map(d => `${d.path?.join('.') || d.path}: ${d.message}`).join(', ')
            }
            setSubmitError(errorMsg)
        }
    }

    const inputClass = "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"

    return (
        <CheckoutPageLayout onBack={handleBack}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Forms */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    {/* Recipient Form */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Icon name="person" size={20} className="text-primary" />
                            Data Penerima
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penerima</label>
                                <input type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Masukkan nama lengkap" className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">No. WhatsApp</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">+62</span>
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="81234567890" className={`${inputClass} pl-14`} />
                                </div>
                            </div>

                            {/* Destination Search - Only show if RajaOngkir is enabled */}
                            {isRajaOngkirEnabled && (
                                <div className="relative">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tujuan Pengiriman</label>
                                    <p className="text-xs text-slate-400 mb-2">Ketik nama kota/kecamatan untuk mencari</p>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={destinationSearch}
                                            onChange={(e) => {
                                                setDestinationSearch(e.target.value)
                                                setShowDestinationResults(true)
                                                setSelectedDestination(null)
                                                setCouriers([])
                                                setSelectedCourier(null)
                                            }}
                                            onFocus={() => !selectedDestination && setShowDestinationResults(true)}
                                            placeholder="Contoh: Bandung, Surabaya, Bekasi..."
                                            className={inputClass}
                                        />
                                        {loadingDestinationSearch && (
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">⏳</span>
                                        )}
                                    </div>

                                    {/* Destination Results Dropdown */}
                                    {showDestinationResults && destinationResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {destinationResults.map((dest, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => handleSelectDestination(dest)}
                                                    className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                                                >
                                                    <p className="font-medium text-slate-900 dark:text-white">{dest.subdistrict_name}</p>
                                                    <p className="text-sm text-slate-500">{dest.district_name}, {dest.city_name}, {dest.province_name}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Selected Destination */}
                                    {selectedDestination && (
                                        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-medium text-green-700 dark:text-green-400">✓ {selectedDestination.subdistrict_name}</p>
                                                <p className="text-xs text-green-600 dark:text-green-500">{selectedDestination.district_name}, {selectedDestination.city_name}, {selectedDestination.province_name}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDestination(null)
                                                    setDestinationSearch('')
                                                    setCouriers([])
                                                    setSelectedCourier(null)
                                                }}
                                                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded bg-white dark:bg-slate-700"
                                            >
                                                Ubah
                                            </button>
                                        </div>
                                    )}

                                    {/* Cek Ongkir Button */}
                                    {selectedDestination && (
                                        <button
                                            type="button"
                                            onClick={calculateShipping}
                                            disabled={isLoadingShipping}
                                            className="w-full py-3 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <Icon name="local_shipping" size={20} />
                                            {isLoadingShipping ? 'Menghitung ongkir...' : 'Cek Ongkos Kirim'}
                                        </button>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Lengkap</label>
                                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Nama jalan, nomor rumah, RT/RW, dll" rows={3} className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* ─── Shipping Type Toggle ─── */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Icon name="local_shipping" size={20} className="text-primary" />
                            Metode Pengiriman
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setShippingType('own_courier')
                                    setSelectedCourier(null)
                                }}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${shippingType === 'own_courier'
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🛵</span>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Kurir Toko</p>
                                        <p className="text-xs text-slate-500">Diantar kurir toko ke lokasi Anda</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShippingType('expedition')
                                    setGpsLocation(null)
                                    setGpsError('')
                                }}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${shippingType === 'expedition'
                                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                    : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📦</span>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white">Jasa Paket</p>
                                        <p className="text-xs text-slate-500">JNE, J&T, SiCepat, dll</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* ─── Own Courier: Share Location ─── */}
                        {shippingType === 'own_courier' && (
                            <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                                <p className="text-sm text-slate-500">
                                    Bagikan lokasi GPS Anda agar kurir toko bisa menemukan alamat dengan mudah. Ongkir akan ditentukan oleh toko.
                                </p>

                                {/* Share Location Button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!navigator.geolocation) {
                                            setGpsError('Browser Anda tidak mendukung GPS.')
                                            return
                                        }
                                        setGpsLoading(true)
                                        setGpsError('')
                                        navigator.geolocation.getCurrentPosition(
                                            (position) => {
                                                setGpsLocation({
                                                    lat: position.coords.latitude,
                                                    lng: position.coords.longitude,
                                                })
                                                setGpsLoading(false)
                                            },
                                            (err) => {
                                                console.error('GPS error:', err)
                                                setGpsError('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi.')
                                                setGpsLoading(false)
                                            },
                                            { enableHighAccuracy: true, timeout: 15000 }
                                        )
                                    }}
                                    disabled={gpsLoading}
                                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    <Icon name="my_location" size={20} />
                                    {gpsLoading ? 'Mengambil lokasi...' : gpsLocation ? '📍 Perbarui Lokasi' : '📍 Bagikan Lokasi GPS'}
                                </button>

                                {gpsError && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                        <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                            <Icon name="error" size={16} />
                                            {gpsError}
                                        </p>
                                    </div>
                                )}

                                {/* GPS Result */}
                                {gpsLocation && (
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Icon name="location_on" size={22} className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Lokasi berhasil didapatkan ✅</p>
                                                <p className="text-xs text-green-600 dark:text-green-500 font-mono mt-0.5">
                                                    {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                                                </p>
                                                <a
                                                    href={`https://www.google.com/maps?q=${gpsLocation.lat},${gpsLocation.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
                                                >
                                                    <Icon name="open_in_new" size={12} /> Lihat di Google Maps
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/50 rounded-xl">
                                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                        <Icon name="info" size={14} className="mt-0.5 flex-shrink-0" />
                                        <span>Ongkos kirim kurir toko akan dihubungi terpisah oleh admin toko via WhatsApp setelah pesanan dibuat.</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── Expedition Shipping Options ─── */}
                    {shippingType === 'expedition' && (
                        <>
                    {/* Fixed Cost Shipping Options */}
                    {fixedCostOptions.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="local_shipping" size={20} className="text-primary" />
                                Pilih Pengiriman
                            </h3>
                            <div className="space-y-3">
                                {fixedCostOptions.map((option) => (
                                    <button
                                        key={`fixed-${option.id}`}
                                        type="button"
                                        onClick={() => setSelectedCourier({
                                            id: `fixed-${option.id}`,
                                            name: option.name,
                                            service: 'Fixed',
                                            description: option.estimation || option.description || '',
                                            cost: option.fixedCost || 0,
                                            etd: option.estimation || '-',
                                            isFixed: true
                                        })}
                                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedCourier?.id === `fixed-${option.id}`
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {option.name}
                                                </p>
                                                <p className="text-sm text-slate-500">{option.estimation || option.description || 'Ongkir tetap'}</p>
                                            </div>
                                            <p className="font-bold text-primary">
                                                Rp {(option.fixedCost || 0).toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RajaOngkir Courier Selection */}
                    {couriers.length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Icon name="local_shipping" size={20} className="text-primary" />
                                Kurir RajaOngkir
                            </h3>
                            <div className="space-y-3">
                                {couriers.map((courier) => (
                                    <button
                                        key={courier.id}
                                        type="button"
                                        onClick={() => setSelectedCourier(courier)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedCourier?.id === courier.id
                                            ? 'border-primary bg-primary/5'
                                            : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {courier.name} - {courier.service}
                                                </p>
                                                <p className="text-sm text-slate-500">{courier.description}</p>
                                                <p className="text-xs text-slate-400 mt-1">Estimasi: {courier.etd} hari</p>
                                            </div>
                                            <p className="font-bold text-primary">
                                                Rp {courier.cost.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Shipping Error */}
                    {shippingError && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                            <p className="text-yellow-600 dark:text-yellow-400 text-sm flex items-center gap-2">
                                <Icon name="warning" size={18} />
                                {shippingError}
                            </p>
                        </div>
                    )}
                        </>
                    )}

                    <CouponSection
                        couponCode={couponCode}
                        onCouponCodeChange={(e) => {
                            setCouponCode(e.target.value)
                            setCouponError('')
                        }}
                        onApplyCoupon={handleApplyCoupon}
                        appliedCoupon={appliedCoupon}
                        savedAmount={couponDiscount > 0 ? `Rp ${couponDiscount.toLocaleString('id-ID')}` : null}
                        error={couponError}
                        isLoading={validateCoupon.isPending}
                    />

                    {/* Payment Method Selection */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Icon name="payments" size={20} className="text-primary" />
                            Metode Pembayaran
                        </h3>
                        <div className="space-y-3">
                            {/* WhatsApp (always available) */}
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('whatsapp')}
                                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'whatsapp'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">💬</span>
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white">WhatsApp (Manual)</p>
                                        <p className="text-sm text-slate-500">Kirim nota pesanan ke admin via WhatsApp</p>
                                    </div>
                                </div>
                            </button>

                            {/* COD (if own_courier) */}
                            {shippingType === 'own_courier' && (
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cod')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'cod'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">💵</span>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">Bayar di Tempat (COD)</p>
                                            <p className="text-sm text-slate-500">Bayar tunai ke Kurir Toko saat paket tiba</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Online Payment (if enabled) */}
                            {isPaymentGatewayEnabled && paymentProvider === 'xendit' && (
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('xendit')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'xendit'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">💳</span>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">Xendit</p>
                                            <p className="text-sm text-slate-500">Transfer Bank, QRIS, E-Wallet, Kartu Kredit</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {isPaymentGatewayEnabled && paymentProvider === 'midtrans' && (
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('midtrans')}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${paymentMethod === 'midtrans'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">💳</span>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">Midtrans</p>
                                            <p className="text-sm text-slate-500">Transfer Bank, GoPay, ShopeePay, Kartu Kredit</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {submitError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                <span>⚠️</span>
                                {submitError}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Column: Summary & Checkout */}
                <div className="lg:col-span-5">
                    <div className="sticky top-28 flex flex-col gap-6">
                        <OrderSummary
                            subtotal={`Rp ${subtotal.toLocaleString('id-ID')}`}
                            totalWeight={`${(totalWeight / 1000).toFixed(1)} kg`}
                            productDiscount={null}
                            couponDiscount={couponDiscount > 0 ? `Rp ${couponDiscount.toLocaleString('id-ID')}` : null}
                            shippingCost={shippingCost === 0 ? 'Pilih kurir' : `Rp ${shippingCost.toLocaleString('id-ID')}`}
                            shippingDiscount={shippingDiscount > 0 ? `Rp ${shippingDiscount.toLocaleString('id-ID')}` : null}
                            shippingName={selectedCourier ? `${selectedCourier.name} - ${selectedCourier.service}` : 'Pilih Kurir'}
                            uniqueCode={`Rp ${uniqueCode}`}
                            total={`Rp ${total.toLocaleString('id-ID')}`}
                            totalSavings={(couponDiscount + shippingDiscount) > 0 ? `Rp ${(couponDiscount + shippingDiscount).toLocaleString('id-ID')}` : null}
                            onCheckout={handleCheckout}
                            isLoading={createOrder.isPending}
                        />

                        <TrustBadges />
                    </div>
                </div>
            </div>
        </CheckoutPageLayout>
    )
}

export default CheckoutPage
