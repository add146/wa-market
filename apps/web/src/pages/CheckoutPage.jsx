import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckoutPageLayout } from '../components/templates'
import {
    RecipientForm,
    CourierSelector,
    CouponSection,
    OrderSummary,
    TrustBadges,
} from '../components/organisms'
import { useShippingOptions, useCreateOrder, useValidateCoupon, useSetting } from '../hooks'

// Mock data for provinces, cities, districts (will be replaced with API later)
const provinces = [
    { value: 'jabar', label: 'Jawa Barat' },
    { value: 'jateng', label: 'Jawa Tengah' },
    { value: 'jatim', label: 'Jawa Timur' },
    { value: 'dki', label: 'DKI Jakarta' },
]

const cities = [
    { value: 'bdg', label: 'Bandung' },
    { value: 'bks', label: 'Bekasi' },
]

const districts = [
    { value: 'kircon', label: 'Kiaracondong' },
    { value: 'bubat', label: 'Buahbatu' },
]

// Mock cart data (will be replaced with cart context/API later)
const mockCartItems = [
    {
        productId: 'e45119ff-63c4-4b38-9631-8510245a66d4',
        quantity: 2,
        variantInfo: 'Grey, L',
        name: 'Sneaker Sport Running Casual',
        price: 280000
    },
]

/**
 * CheckoutPage - Main checkout page
 */
function CheckoutPage() {
    const navigate = useNavigate()

    // Fetch shipping options from API
    const { data: shippingOptions = [] } = useShippingOptions()
    const { data: whatsappKasir } = useSetting('whatsapp_kasir')

    // Order mutation
    const createOrder = useCreateOrder()
    const validateCoupon = useValidateCoupon()

    // Form state
    const [recipientName, setRecipientName] = useState('')
    const [phone, setPhone] = useState('')
    const [province, setProvince] = useState('')
    const [city, setCity] = useState('')
    const [district, setDistrict] = useState('')
    const [address, setAddress] = useState('')

    // Courier state
    const [selectedCourier, setSelectedCourier] = useState('')

    // Coupon state
    const [couponCode, setCouponCode] = useState('')
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [couponDiscount, setCouponDiscount] = useState(0)
    const [couponError, setCouponError] = useState('')

    // Error state
    const [submitError, setSubmitError] = useState('')

    // Calculate subtotal from cart items
    const subtotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    // Get selected courier details
    const selectedCourierData = shippingOptions.find(c => c.id === selectedCourier)
    const shippingCost = selectedCourierData?.type === 'free'
        ? (subtotal >= (selectedCourierData?.minPurchaseForFree || 0) ? 0 : selectedCourierData?.fixedCost || 0)
        : (selectedCourierData?.fixedCost || 15000)

    // Generate unique code
    const uniqueCode = 123

    // Calculate total
    const productDiscount = 0 // Calculate from product originalPrice vs price
    const total = subtotal - productDiscount - couponDiscount + shippingCost + uniqueCode

    // Transform shipping options for CourierSelector
    const couriers = shippingOptions.map(opt => ({
        id: opt.id,
        name: opt.name,
        estimation: opt.estimation || 'Estimasi 2-5 hari',
        price: opt.type === 'free'
            ? (subtotal >= (opt.minPurchaseForFree || 0) ? 'GRATIS' : `Rp ${(opt.fixedCost || 0).toLocaleString('id-ID')}`)
            : `Rp ${(opt.fixedCost || 15000).toLocaleString('id-ID')}`,
        priceValue: opt.type === 'free' ? 0 : (opt.fixedCost || 15000),
        logoColor: 'bg-blue-600/20',
    }))

    // Handle back navigation
    const handleBack = (e) => {
        e.preventDefault()
        navigate('/cart')
    }

    // Handle coupon apply
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

    // Handle checkout
    const handleCheckout = async () => {
        setSubmitError('')

        // Validation
        if (!recipientName || !phone || !province || !city || !district || !address) {
            setSubmitError('Harap lengkapi semua data penerima')
            return
        }

        if (!selectedCourier) {
            setSubmitError('Harap pilih kurir pengiriman')
            return
        }

        try {
            const orderData = {
                recipientName,
                recipientPhone: `62${phone}`,
                province: provinces.find(p => p.value === province)?.label || province,
                city: cities.find(c => c.value === city)?.label || city,
                district: districts.find(d => d.value === district)?.label || district,
                address,
                shippingOptionId: selectedCourier,
                courierName: selectedCourierData?.name || 'Unknown',
                shippingCost,
                couponCode: appliedCoupon,
                guestPhone: `62${phone}`,
                items: mockCartItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    variantInfo: item.variantInfo,
                })),
            }

            const result = await createOrder.mutateAsync(orderData)

            // Redirect to WhatsApp with order message
            if (result.whatsappUrl) {
                window.open(result.whatsappUrl, '_blank')
            }

            // Show success and redirect
            alert(`✅ Pesanan berhasil dibuat!\n\nNo. Order: ${result.order.orderNumber}\nTotal: Rp ${result.order.total.toLocaleString('id-ID')}\n\nSilakan lanjutkan pembayaran via WhatsApp`)
            navigate('/')
        } catch (error) {
            setSubmitError(error.message || 'Gagal membuat pesanan. Silakan coba lagi.')
        }
    }

    return (
        <CheckoutPageLayout onBack={handleBack}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Forms */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    <RecipientForm
                        recipientName={recipientName}
                        onRecipientNameChange={(e) => setRecipientName(e.target.value)}
                        phone={phone}
                        onPhoneChange={(e) => setPhone(e.target.value)}
                        province={province}
                        onProvinceChange={(e) => setProvince(e.target.value)}
                        city={city}
                        onCityChange={(e) => setCity(e.target.value)}
                        district={district}
                        onDistrictChange={(e) => setDistrict(e.target.value)}
                        address={address}
                        onAddressChange={(e) => setAddress(e.target.value)}
                        provinces={provinces}
                        cities={cities}
                        districts={districts}
                    />

                    {couriers.length > 0 && (
                        <CourierSelector
                            selectedCourier={selectedCourier}
                            onCourierChange={setSelectedCourier}
                            couriers={couriers}
                        />
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

                    {/* Error Message */}
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
                            productDiscount={productDiscount > 0 ? `Rp ${productDiscount.toLocaleString('id-ID')}` : null}
                            couponDiscount={couponDiscount > 0 ? `Rp ${couponDiscount.toLocaleString('id-ID')}` : null}
                            shippingCost={shippingCost === 0 ? 'GRATIS' : `Rp ${shippingCost.toLocaleString('id-ID')}`}
                            shippingName={selectedCourierData?.name || 'Pilih Kurir'}
                            uniqueCode={`Rp ${uniqueCode}`}
                            total={`Rp ${total.toLocaleString('id-ID')}`}
                            totalSavings={couponDiscount > 0 ? `Rp ${couponDiscount.toLocaleString('id-ID')}` : null}
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
