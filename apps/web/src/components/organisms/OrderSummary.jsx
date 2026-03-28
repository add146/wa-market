import { Icon, Button } from '../atoms'

/**
 * OrderSummary - Ringkasan Pesanan card
 */
function OrderSummary({
    subtotal,
    totalWeight,
    productDiscount,
    couponDiscount,
    shippingCost,
    shippingDiscount,
    shippingName,
    uniqueCode,
    total,
    totalSavings,
    onCheckout,
    isLoading,
}) {
    return (
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-color dark:border-surface-dark shadow-lg overflow-hidden">
            {/* Summary Section */}
            <div className="p-6 lg:p-8 bg-gradient-to-b from-background-light to-transparent dark:from-surface-dark">
                <h2 className="text-xl font-bold text-text-main-light dark:text-white mb-6">
                    Ringkasan Pesanan
                </h2>

                <div className="space-y-4 text-sm">
                    {/* Subtotal */}
                    <div className="flex justify-between items-center text-text-main-light/70 dark:text-gray-400">
                        <span>Subtotal Produk</span>
                        <span className="font-medium text-text-main-light dark:text-white">
                            {subtotal}
                        </span>
                    </div>

                    {/* Total Weight */}
                    {totalWeight && (
                        <div className="flex justify-between items-center text-text-main-light/70 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                                <Icon name="scale" size={16} />
                                Total Berat
                            </span>
                            <span className="font-medium text-text-main-light dark:text-white">
                                {totalWeight}
                            </span>
                        </div>
                    )}

                    {/* Product Discount */}
                    {productDiscount && (
                        <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                            <span>Diskon Produk</span>
                            <span className="font-medium">- {productDiscount}</span>
                        </div>
                    )}

                    {/* Coupon Discount */}
                    {couponDiscount && (
                        <div className="flex justify-between items-center text-accent-orange">
                            <span>Diskon Kupon</span>
                            <span className="font-medium">- {couponDiscount}</span>
                        </div>
                    )}

                    {/* Shipping Cost */}
                    <div className="flex justify-between items-center text-text-main-light/70 dark:text-gray-400">
                        <span>Ongkos Kirim ({shippingName})</span>
                        <span className="font-medium text-text-main-light dark:text-white">
                            {shippingCost}
                        </span>
                    </div>

                    {/* Shipping Discount */}
                    {shippingDiscount && (
                        <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                            <span className="flex items-center gap-1">
                                <Icon name="local_offer" size={16} />
                                Potongan Ongkir
                            </span>
                            <span className="font-medium">- {shippingDiscount}</span>
                        </div>
                    )}

                    {/* Unique Code */}
                    <div className="flex justify-between items-center text-text-main-light/70 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            Kode Unik
                            <Icon
                                name="help"
                                size={14}
                                className="text-gray-400 cursor-help"
                            />
                        </span>
                        <span className="font-medium text-text-main-light dark:text-white">
                            {uniqueCode}
                        </span>
                    </div>
                </div>

                {/* Divider */}
                <div className="my-6 border-t border-dashed border-gray-300 dark:border-gray-700" />

                {/* Total */}
                <div className="flex justify-between items-end mb-2">
                    <span className="text-lg font-bold text-text-main-light dark:text-white">
                        TOTAL
                    </span>
                    <span className="text-3xl font-extrabold text-primary">
                        {total}
                    </span>
                </div>

                {/* Savings Badge */}
                {totalSavings && (
                    <div className="flex justify-end">
                        <div className="inline-flex items-center gap-1 bg-accent-orange/10 text-accent-orange px-3 py-1 rounded-full text-xs font-bold border border-accent-orange/20">
                            <Icon name="savings" size={14} />
                            Anda hemat {totalSavings}!
                        </div>
                    </div>
                )}
            </div>

            {/* CTA Section */}
            <div className="bg-background-light dark:bg-[#152a23] p-6 lg:p-8 border-t border-border-color dark:border-surface-dark">
                <p className="text-sm text-center text-text-main-light/70 dark:text-gray-400 mb-4">
                    Kirim detail pesanan ini ke WhatsApp Admin. <strong>Wajib lampirkan bukti transfer (Foto Nota)</strong> ke nomor tersebut agar pesanan langsung diproses.
                </p>

                <Button
                    variant="whatsapp"
                    onClick={onCheckout}
                    disabled={isLoading}
                    className="group w-full text-lg py-4 px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 flex items-center justify-center gap-3 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    {isLoading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            MEMPROSES...
                        </>
                    ) : (
                        <>
                            <Icon name="chat" size={24} className="group-hover:animate-pulse" />
                            KIRIM NOTA VIA WA
                        </>
                    )}
                </Button>

                <div className="mt-6 flex justify-center items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Butuh bantuan?</span>
                    <a
                        href="#"
                        className="text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                        Hubungi Admin Kasir
                        <Icon name="open_in_new" size={14} />
                    </a>
                </div>
            </div>
        </div>
    )
}

export default OrderSummary
