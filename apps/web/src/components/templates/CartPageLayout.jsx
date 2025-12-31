/**
 * CartPageLayout - Layout untuk halaman keranjang
 * Dengan backdrop overlay dan panel slide-out
 */
function CartPageLayout({ children, onClose }) {
    return (
        <div className="relative h-screen overflow-hidden">
            {/* Main Page Content Background (Simulated behind the drawer) */}
            <div
                aria-hidden="true"
                className="w-full h-full flex items-center justify-center p-10 opacity-30 pointer-events-none"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                    <div className="bg-white h-64 rounded-xl shadow-sm"></div>
                    <div className="bg-white h-64 rounded-xl shadow-sm"></div>
                    <div className="bg-white h-64 rounded-xl shadow-sm"></div>
                </div>
            </div>

            {/* Backdrop Overlay */}
            <div
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out cursor-pointer"
                aria-label="Tutup keranjang"
            />

            {/* Cart Panel Container */}
            {children}
        </div>
    )
}

export default CartPageLayout
