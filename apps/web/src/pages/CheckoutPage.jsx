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
import { getDistanceKm, geocodeAddress } from '../utils/geo'

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

    // Store GPS & delivery radius settings
    const { data: storeLat } = useSetting('store_lat')
    const { data: storeLng } = useSetting('store_lng')
    const { data: storeDeliveryRadius } = useSetting('store_delivery_radius')
    const { data: storeDeliveryCost } = useSetting('store_delivery_cost')
    const ownCourierCost = storeDeliveryCost ? parseInt(storeDeliveryCost, 10) : 0
    const hasStoreGps = storeLat && storeLng && parseFloat(storeLat) && parseFloat(storeLng)
    const maxRadius = storeDeliveryRadius ? parseFloat(storeDeliveryRadius) : null

    // Delivery schedule settings
    const { data: deliveryScheduleRaw } = useSetting('delivery_schedule')
    const { data: deliveryHoursAfterPayment } = useSetting('delivery_hours_after_payment')

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

    // RajaOngkir Dropdown state for destination
    const [provinces, setProvinces] = useState([])
    const [cities, setCities] = useState([])
    const [subdistricts, setSubdistricts] = useState([])
    const [loadingRajaongkirData, setLoadingRajaongkirData] = useState(false)
    const [selectedProvinceId, setSelectedProvinceId] = useState('')
    const [selectedCityId, setSelectedCityId] = useState('')
    const [selectedSubdistrictId, setSelectedSubdistrictId] = useState('')
    const [selectedDestination, setSelectedDestination] = useState(null)

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

    // Radius validation state
    const [distanceToStore, setDistanceToStore] = useState(null) // km
    const [isWithinRadius, setIsWithinRadius] = useState(null) // true/false/null

    // Address geocoding state (fallback for radius validation)
    const [deliveryAddressSearch, setDeliveryAddressSearch] = useState('')
    const [geocodeResults, setGeocodeResults] = useState([])
    const [geocodeLoading, setGeocodeLoading] = useState(false)
    const [hasGeocodeSearched, setHasGeocodeSearched] = useState(false)
    const [selectedGeocode, setSelectedGeocode] = useState(null) // { lat, lng, displayName }
    const [geocodeDistance, setGeocodeDistance] = useState(null)
    const [geocodeWithinRadius, setGeocodeWithinRadius] = useState(null)

    // Selected delivery time slot (for own courier)
    const [selectedDeliverySlot, setSelectedDeliverySlot] = useState(null) // { date, time, label }

    // Enriched cart items with fresh weights from API
    const [fetchedProducts, setFetchedProducts] = useState({})

    // Fetch fresh product info on mount
    useEffect(() => {
        const fetchProductInfo = async () => {
            if (cartItems.length === 0) return

            try {
                // Get unique product IDs
                const productIds = [...new Set(cartItems.map(item => item.productId))]
                const productsInfo = {}

                // Fetch each product to get fresh weight, productType, preorderDays
                for (const productId of productIds) {
                    try {
                        const response = await productsApi.getById(productId)
                        if (response.data) {
                            productsInfo[productId] = response.data
                        }
                    } catch (err) {
                        console.log('Could not fetch info for product:', productId)
                    }
                }

                setFetchedProducts(productsInfo)
            } catch (error) {
                console.error('Error fetching product weights:', error)
            }
        }

        fetchProductInfo()
    }, [cartItems])

    // Compute cart summary info
    const isOnlyDigital = cartItems.length > 0 && cartItems.every(item => {
        const p = fetchedProducts[item.productId]
        return p?.productType === 'digital'
    })
    const hasDigital = cartItems.some(item => fetchedProducts[item.productId]?.productType === 'digital')
    const hasPreorder = cartItems.some(item => fetchedProducts[item.productId]?.productType === 'preorder')
    const maxPreorderDays = cartItems.reduce((max, item) => {
        const p = fetchedProducts[item.productId]
        const days = p?.productType === 'preorder' ? (p.preorderDays || 0) : 0
        return Math.max(max, days)
    }, 0)

    // Calculate subtotal from cart
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    // Use fresh weights from API if available, otherwise fallback to cart item weight or 500g
    // Exclude digital products from weight entirely
    const totalWeight = cartItems.reduce((sum, item) => {
        const p = fetchedProducts[item.productId]
        if (p?.productType === 'digital') return sum

        const weight = p?.weight || item.weight || 500
        return sum + (weight * item.quantity)
    }, 0)

    // Shipping cost from selected courier (own courier = uses store setting, or free)
    const shippingCost = shippingType === 'own_courier' ? ownCourierCost : (selectedCourier?.cost || 0)
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

    // Fetch RajaOngkir Provinces on Load
    useEffect(() => {
        if (!isRajaOngkirEnabled) return
        
        const fetchProvinces = async () => {
            try {
                const res = await rajaongkirApi.getProvinces()
                setProvinces(res.data?.data || [])
            } catch (error) {
                console.error('Failed to fetch provinces', error)
            }
        }
        fetchProvinces()
    }, [isRajaOngkirEnabled])

    // Fetch Cities when Province changes
    useEffect(() => {
        if (!selectedProvinceId) {
            setCities([])
            return
        }
        const fetchCities = async () => {
            setLoadingRajaongkirData(true)
            try {
                const res = await rajaongkirApi.getCities(selectedProvinceId)
                setCities(res.data?.data || [])
            } catch (error) {
                console.error('Failed to fetch cities', error)
            } finally {
                setLoadingRajaongkirData(false)
            }
        }
        fetchCities()
    }, [selectedProvinceId])

    // Fetch Subdistricts when City changes
    useEffect(() => {
        if (!selectedCityId) {
            setSubdistricts([])
            return
        }
        const fetchSubdistricts = async () => {
            setLoadingRajaongkirData(true)
            try {
                const res = await rajaongkirApi.getDistricts(selectedCityId)
                // If it fails with 400 (Starter tier), API will return error, safe to ignore/empty
                if (res.data?.data) {
                    setSubdistricts(res.data.data)
                } else {
                    setSubdistricts([])
                }
            } catch (error) {
                console.error('Failed to fetch subdistricts', error)
                setSubdistricts([])
            } finally {
                setLoadingRajaongkirData(false)
            }
        }
        fetchSubdistricts()
    }, [selectedCityId])

    // Calculate shipping when destination is selected
    const calculateShipping = async () => {
        // Find highest granularity destination selected
        let destId = selectedSubdistrictId || selectedCityId;
        if (!destId) return;

        let destType = selectedSubdistrictId ? 'subdistrict' : 'city';

        setIsLoadingShipping(true)
        setShippingError('')
        setCouriers([])

        try {
            const response = await rajaongkirApi.calculateCost({
                destination: destId,
                destinationType: destType,
                weight: totalWeight || 1000
            })

            if (response.data?.data && response.data.data.length > 0) {
                // RajaOngkir V2 returns flat array: {name, code, service, description, cost, etd}
                // Starter/Basic API might map it via our backend proxy
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
            setShippingError(error?.response?.data?.error || error.message || 'Gagal menghitung ongkir. Pastikan API Key dikonfigurasi.')
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
        if (!isOnlyDigital) {
            if (shippingType === 'own_courier') {
                // For own courier, GPS or address is enough, no courier selection needed
                if (!gpsLocation && !address) {
                    setSubmitError('Harap bagikan lokasi GPS atau isi alamat lengkap untuk kurir sendiri')
                    return
                }
                // Block if out of radius (and radius is enforced)
                if (hasStoreGps && maxRadius) {
                    const gpsOk = isWithinRadius === true
                    const addressOk = geocodeWithinRadius === true
                    if (!gpsOk && !addressOk) {
                        setSubmitError(`Lokasi pengiriman di luar jangkauan kurir toko (maks ${maxRadius} km). Silakan bagikan lokasi GPS atau cari alamat yang masuk radius.`)
                        return
                    }
                }
            } else {
                if (!selectedCourier) {
                    setSubmitError('Harap pilih kurir pengiriman')
                    return
                }
                // Only require destination for RajaOngkir couriers (not fixed cost)
                if (!selectedCourier.isFixed && !(selectedSubdistrictId || selectedCityId)) {
                    setSubmitError('Harap pilih tujuan pengiriman untuk kurir RajaOngkir')
                    return
                }
            }
        }
        
        if (paymentMethod === 'cod' && shippingType !== 'own_courier') {
            setSubmitError('Pembayaran COD (Bayar di Tempat) hanya tersedia untuk Kurir Toko')
            return
        }

        try {
            // Use GPS coords, or fall back to geocoded address coords for courier navigation
            const deliveryLat = gpsLocation?.lat ?? selectedGeocode?.lat ?? null
            const deliveryLng = gpsLocation?.lng ?? selectedGeocode?.lng ?? null

            const provName = provinces.find(p => String(p.province_id) === String(selectedProvinceId))?.province || '';
            const cityName = cities.find(c => String(c.city_id) === String(selectedCityId))?.city_name || '';
            const subName = subdistricts.find(s => String(s.subdistrict_id) === String(selectedSubdistrictId))?.subdistrict_name || '';

            const orderData = {
                recipientName,
                recipientPhone: `62${phone}`,
                province: provName,
                city: cityName,
                district: subName,
                address,
                shippingType: isOnlyDigital ? 'digital' : shippingType,
                latitude: deliveryLat?.toString() || '',
                longitude: deliveryLng?.toString() || '',
                shippingOptionId: isOnlyDigital ? null : (selectedCourier?.id || null),
                courierName: isOnlyDigital
                    ? 'Produk Digital'
                    : (shippingType === 'own_courier'
                        ? 'Kurir Toko'
                        : `${selectedCourier?.name || 'Manual'} - ${selectedCourier?.service || ''}`),
                shippingCost: isOnlyDigital ? 0 : (shippingType === 'own_courier' ? ownCourierCost : (selectedCourier?.cost || 0)),
                couponCode: appliedCoupon,
                guestPhone: `62${phone}`,
                paymentMethod,
                deliverySlot: selectedDeliverySlot ? `${selectedDeliverySlot.label}, ${selectedDeliverySlot.time}` : '',
                items: cartItems.map(item => ({
                    productId: item.productId,
                    productName: item.name,
                    price: item.price,
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

                            {/* Product Types Notifications */}
                            {hasPreorder && (
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl mb-4 text-sm text-orange-700 dark:text-orange-400">
                                    <Icon name="info" size={16} className="inline mr-2 align-text-bottom" />
                                    Pesanan Anda mengandung produk <strong>Pre-Order (PO)</strong> dengan estimasi {maxPreorderDays} hari kerja.
                                </div>
                            )}
                            {hasDigital && !isOnlyDigital && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-4 text-sm text-blue-700 dark:text-blue-400">
                                    <Icon name="email" size={16} className="inline mr-2 align-text-bottom" />
                                    Pesanan Anda mengandung produk <strong>Digital</strong> yang akan dikirim via WhatsApp terpisah dari paket fisik.
                                </div>
                            )}
                            {isOnlyDigital && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-4 text-sm text-blue-700 dark:text-blue-400">
                                    <Icon name="email" size={16} className="inline mr-2 align-text-bottom" />
                                    Pesanan Anda hanya berisi produk <strong>Digital</strong>. Anda tidak dikenakan biaya ongkos kirim.
                                </div>
                            )}

                            {/* Destination Selection - Only show if RajaOngkir is enabled AND not numeric */}
                            {isRajaOngkirEnabled && !isOnlyDigital && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tujuan Pengiriman</label>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Provinsi</label>
                                        <select
                                            value={selectedProvinceId}
                                            onChange={(e) => {
                                                setSelectedProvinceId(e.target.value)
                                                setSelectedCityId('')
                                                setSelectedSubdistrictId('')
                                                setCouriers([])
                                                setSelectedCourier(null)
                                            }}
                                            className={inputClass}
                                        >
                                            <option value="">Pilih Provinsi...</option>
                                            {provinces.map(p => (
                                                <option key={p.province_id} value={p.province_id}>{p.province}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Kota/Kabupaten</label>
                                        <select
                                            value={selectedCityId}
                                            onChange={(e) => {
                                                setSelectedCityId(e.target.value)
                                                setSelectedSubdistrictId('')
                                                setCouriers([])
                                                setSelectedCourier(null)
                                            }}
                                            disabled={!selectedProvinceId || loadingRajaongkirData}
                                            className={inputClass}
                                        >
                                            <option value="">Pilih Kota/Kabupaten...</option>
                                            {cities.map(c => (
                                                <option key={c.city_id} value={c.city_id}>{c.type} {c.city_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Subdistrict Dropdown - Only display if tier provides subdistricts */}
                                    {subdistricts.length > 0 && (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Kecamatan</label>
                                            <select
                                                value={selectedSubdistrictId}
                                                onChange={(e) => {
                                                    setSelectedSubdistrictId(e.target.value)
                                                    setCouriers([])
                                                    setSelectedCourier(null)
                                                }}
                                                disabled={!selectedCityId || loadingRajaongkirData}
                                                className={inputClass}
                                            >
                                                <option value="">Pilih Kecamatan...</option>
                                                {subdistricts.map(s => (
                                                    <option key={s.subdistrict_id} value={s.subdistrict_id}>{s.subdistrict_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {loadingRajaongkirData && (
                                        <p className="text-xs text-slate-400">Sedang memuat data wilayah...</p>
                                    )}

                                    {/* Cek Ongkir Button */}
                                    {(selectedSubdistrictId || (selectedCityId && subdistricts.length === 0)) && (
                                        <button
                                            type="button"
                                            onClick={calculateShipping}
                                            disabled={isLoadingShipping || loadingRajaongkirData}
                                            className={`w-full py-3 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
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
                    {!isOnlyDigital && (
                        <>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                            <Icon name="local_shipping" size={20} className="text-primary" />
                            Metode Pengiriman
                        </h3>
                        {/* Only show Kurir Toko if store GPS is configured */}
                        <div className={`grid ${hasStoreGps ? 'grid-cols-2' : 'grid-cols-1'} gap-3 mb-4`}>
                            {hasStoreGps && (
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
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <p className="font-bold text-slate-900 dark:text-white">Kurir Toko</p>
                                                {ownCourierCost > 0 && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">
                                                        Rp {ownCourierCost.toLocaleString('id-ID')}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">Diantar kurir toko ke lokasi Anda</p>
                                        </div>
                                    </div>
                                </button>
                            )}
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
                                    {hasStoreGps && maxRadius
                                        ? `Bagikan lokasi GPS atau cari alamat tujuan untuk memastikan lokasi Anda dalam radius ${maxRadius} km dari toko.`
                                        : 'Bagikan lokasi GPS Anda agar kurir toko bisa menemukan alamat dengan mudah.'}
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
                                                const loc = {
                                                    lat: position.coords.latitude,
                                                    lng: position.coords.longitude,
                                                }
                                                setGpsLocation(loc)
                                                setGpsLoading(false)

                                                // Check distance if store has GPS
                                                if (hasStoreGps) {
                                                    const dist = getDistanceKm(
                                                        loc.lat, loc.lng,
                                                        parseFloat(storeLat), parseFloat(storeLng)
                                                    )
                                                    setDistanceToStore(dist)
                                                    if (maxRadius) {
                                                        setIsWithinRadius(dist <= maxRadius)
                                                    } else {
                                                        setIsWithinRadius(true)
                                                    }
                                                }
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

                                {/* GPS Result + Distance */}
                                {gpsLocation && (
                                    <div className={`p-4 rounded-xl border ${
                                        isWithinRadius === false
                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                isWithinRadius === false ? 'bg-red-500/20' : 'bg-green-500/20'
                                            }`}>
                                                <Icon name="location_on" size={22} className={isWithinRadius === false ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-semibold ${
                                                    isWithinRadius === false
                                                        ? 'text-red-700 dark:text-red-400'
                                                        : 'text-green-700 dark:text-green-400'
                                                }`}>
                                                    {isWithinRadius === false
                                                        ? `⚠️ Lokasi GPS Anda di luar jangkauan (${distanceToStore?.toFixed(1)} km)`
                                                        : `Lokasi berhasil didapatkan ✅${distanceToStore ? ` — Jarak: ${distanceToStore.toFixed(1)} km` : ''}`}
                                                </p>
                                                <p className="text-xs text-slate-500 font-mono mt-0.5">
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

                                {/* ─── Address Geocode Fallback ─── */}
                                {/* Show if: no GPS yet, OR GPS is outside radius */}
                                {(hasStoreGps && maxRadius && (isWithinRadius === false || !gpsLocation)) && (
                                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            📍 Cari alamat tujuan pengiriman:
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Masukkan alamat lengkap tujuan pengiriman. Bisa digunakan jika Anda memesan untuk dikirim ke alamat lain yang masuk radius toko (contoh: rumah keluarga, kantor, dll).
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={deliveryAddressSearch}
                                                onChange={(e) => {
                                                    setDeliveryAddressSearch(e.target.value)
                                                    setSelectedGeocode(null)
                                                    setGeocodeDistance(null)
                                                    setGeocodeWithinRadius(null)
                                                    setHasGeocodeSearched(false)
                                                }}
                                                placeholder="Contoh: Jl. Merdeka No. 10, Bandung"
                                                className={inputClass}
                                            />
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!deliveryAddressSearch || deliveryAddressSearch.length < 5) return
                                                    setGeocodeLoading(true)
                                                    setGeocodeResults([])
                                                    setHasGeocodeSearched(false)
                                                    try {
                                                        const results = await geocodeAddress(deliveryAddressSearch)
                                                        setGeocodeResults(results)
                                                    } catch (err) {
                                                        console.error('Geocode error:', err)
                                                    } finally {
                                                        setGeocodeLoading(false)
                                                        setHasGeocodeSearched(true)
                                                    }
                                                }}
                                                disabled={geocodeLoading || deliveryAddressSearch.length < 5}
                                                className="px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 whitespace-nowrap text-sm"
                                            >
                                                {geocodeLoading ? '⏳' : 'Cari'}
                                            </button>
                                        </div>

                                        {/* Geocode Results */}
                                        {hasGeocodeSearched && geocodeResults.length === 0 && !selectedGeocode && !geocodeLoading && (
                                            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    Alamat tidak ditemukan di peta. Coba gunakan kata kunci yang lebih luas (contoh: nama jalan besar, kelurahan, atau kecamatan).
                                                </p>
                                            </div>
                                        )}
                                        {geocodeResults.length > 0 && !selectedGeocode && (
                                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                                {geocodeResults.map((result, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedGeocode(result)
                                                            setGeocodeResults([])
                                                            // Calculate distance
                                                            const dist = getDistanceKm(
                                                                result.lat, result.lng,
                                                                parseFloat(storeLat), parseFloat(storeLng)
                                                            )
                                                            setGeocodeDistance(dist)
                                                            setGeocodeWithinRadius(maxRadius ? dist <= maxRadius : true)
                                                        }}
                                                        className="w-full p-3 text-left rounded-lg border border-slate-200 dark:border-slate-600 hover:border-primary/50 hover:bg-primary/5 transition-all"
                                                    >
                                                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{result.displayName}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Selected Geocode Result */}
                                        {selectedGeocode && (
                                            <div className={`p-3 rounded-lg border ${
                                                geocodeWithinRadius
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                            }`}>
                                                <p className={`text-sm font-semibold ${
                                                    geocodeWithinRadius
                                                        ? 'text-green-700 dark:text-green-400'
                                                        : 'text-red-700 dark:text-red-400'
                                                }`}>
                                                    {geocodeWithinRadius
                                                        ? `✅ Dalam jangkauan! Jarak: ${geocodeDistance?.toFixed(1)} km`
                                                        : `❌ Di luar jangkauan. Jarak: ${geocodeDistance?.toFixed(1)} km (maks ${maxRadius} km)`}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{selectedGeocode.displayName}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedGeocode(null)
                                                        setGeocodeDistance(null)
                                                        setGeocodeWithinRadius(null)
                                                        setDeliveryAddressSearch('')
                                                    }}
                                                    className="text-xs text-slate-500 hover:text-slate-700 mt-1 underline"
                                                >
                                                    Ubah alamat
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Info: cannot use Kurir Toko if out of radius */}
                                {hasStoreGps && maxRadius && isWithinRadius === false && geocodeWithinRadius !== true && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                        <p className="text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                                            <Icon name="error" size={16} className="mt-0.5 flex-shrink-0" />
                                            <span>Lokasi pengiriman di luar jangkauan kurir toko ({maxRadius} km). Silakan gunakan Jasa Paket atau cari alamat yang masuk radius di atas.</span>
                                        </p>
                                    </div>
                                )}

                                {/* Delivery Schedule Picker */}
                                {(() => {
                                    // Pilihan jadwal aktif jika gps approve
                                    const isGpsOk = (!hasStoreGps || !maxRadius) || (isWithinRadius === true || geocodeWithinRadius === true)
                                    if (!isGpsOk) return null

                                    let schedule = {}
                                    try { schedule = deliveryScheduleRaw ? JSON.parse(deliveryScheduleRaw) : {} } catch { schedule = {} }
                                    const dayKeyOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
                                    const dayNamesID = { mon: 'Senin', tue: 'Selasa', wed: 'Rabu', thu: 'Kamis', fri: 'Jumat', sat: 'Sabtu', sun: 'Minggu' }
                                    const hasHours = deliveryHoursAfterPayment && parseInt(deliveryHoursAfterPayment) > 0

                                    // Build available slots for the next 7 days, starting from pre-order requirement
                                    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
                                    const nowTimeMs = now.getTime()
                                    // jam hide jika pemesanan dibawah 30 menit dari pengiriman
                                    const minimumSlotTimeMs = nowTimeMs + (30 * 60 * 1000)

                                    const availableSlots = []
                                    const limit = 7 // limit options to 7 valid days
                                    for (let offset = 0; offset < limit; offset++) {
                                        const actualOffsetDays = maxPreorderDays + offset
                                        
                                        const slotDate = new Date(now)
                                        slotDate.setDate(now.getDate() + actualOffsetDays)
                                        
                                        const dayIdx = (slotDate.getDay() + 6) % 7 // 0=Mon, 6=Sun
                                        const dayKey = dayKeyOrder[dayIdx]
                                        
                                        const slots = schedule[dayKey]
                                        if (!Array.isArray(slots) || slots.length === 0) continue

                                        const dateStr = slotDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })

                                        let dayLabel
                                        if (actualOffsetDays === 0) dayLabel = 'Hari Ini'
                                        else if (actualOffsetDays === 1) dayLabel = 'Besok'
                                        else dayLabel = dayNamesID[dayKey]

                                        const fullLabel = `${dayLabel}, ${dateStr}`

                                        const filteredSlots = slots.sort().filter(time => {
                                            const [hh, mm] = time.split(':')
                                            const slotExactTime = new Date(slotDate)
                                            slotExactTime.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0)
                                            return slotExactTime.getTime() >= minimumSlotTimeMs
                                        })

                                        if (filteredSlots.length > 0) {
                                            availableSlots.push({ dayKey, label: fullLabel, date: dateStr, times: filteredSlots })
                                        }
                                    }

                                    const hasSchedule = availableSlots.length > 0
                                    if (!hasSchedule && !hasHours) return null

                                    return (
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl space-y-3">
                                            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                                <Icon name="schedule" size={16} />
                                                Pilih Jadwal Pengiriman
                                            </p>

                                            {hasHours && (
                                                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-800/30 rounded-lg p-2">
                                                    <Icon name="timer" size={14} className="flex-shrink-0" />
                                                    <span>Estimasi pengiriman <strong>{deliveryHoursAfterPayment} jam</strong> setelah pelunasan</span>
                                                </div>
                                            )}

                                            {hasSchedule ? (
                                                <div className="space-y-2">
                                                    {availableSlots.map(day => (
                                                        <div key={day.dayKey + day.date}>
                                                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1.5">{day.label}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {day.times.map(time => {
                                                                    const slotId = `${day.date}__${time}`
                                                                    const isSelected = selectedDeliverySlot?.date === day.date && selectedDeliverySlot?.time === time
                                                                    return (
                                                                        <button
                                                                            key={slotId}
                                                                            type="button"
                                                                            onClick={() => setSelectedDeliverySlot(isSelected ? null : { date: day.date, time, label: day.label })}
                                                                            className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                                                                                isSelected
                                                                                    ? 'border-primary bg-primary text-white shadow-md scale-105'
                                                                                    : 'border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-primary hover:text-primary'
                                                                            }`}
                                                                        >
                                                                            <Icon name="schedule" size={14} className="inline mr-1" />
                                                                            {time}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500">Tidak ada jadwal pengiriman tersedia saat ini.</p>
                                            )}

                                            {selectedDeliverySlot && (
                                                <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 rounded-lg p-2">
                                                    <Icon name="check_circle" size={16} />
                                                    <span>Dipilih: {selectedDeliverySlot.label}, pukul {selectedDeliverySlot.time} WIB</span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })()}

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
                    </>
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
                            shippingCost={isOnlyDigital ? 'Gratis (Digital)' : (shippingType === 'expedition' && !selectedCourier ? 'Pilih kurir' : (shippingCost === 0 ? 'Gratis' : `Rp ${shippingCost.toLocaleString('id-ID')}`))}
                            shippingDiscount={shippingDiscount > 0 ? `Rp ${shippingDiscount.toLocaleString('id-ID')}` : null}
                            shippingName={isOnlyDigital ? 'Produk Digital' : (shippingType === 'own_courier' ? 'Kurir Toko' : (selectedCourier ? `${selectedCourier.name} - ${selectedCourier.service}` : 'Pilih Kurir'))}
                            uniqueCode={`Rp ${uniqueCode}`}
                            total={`Rp ${total.toLocaleString('id-ID')}`}
                            totalSavings={(couponDiscount + shippingDiscount) > 0 ? `Rp ${(couponDiscount + shippingDiscount).toLocaleString('id-ID')}` : null}
                            onCheckout={handleCheckout}
                            isLoading={createOrder.isPending}
                            paymentMethod={paymentMethod}
                        />

                        <TrustBadges />
                    </div>
                </div>
            </div>
        </CheckoutPageLayout>
    )
}

export default CheckoutPage
