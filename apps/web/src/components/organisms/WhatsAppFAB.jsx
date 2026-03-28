import { Icon } from '../atoms'

/**
 * WhatsAppFAB - Floating WhatsApp action button
 */
function WhatsAppFAB({ phoneNumber = '', message = 'Halo, saya tertarik dengan produk TokoIndo' }) {
    const handleClick = () => {
        const encodedMessage = encodeURIComponent(message)
        const waUrl = phoneNumber
            ? `https://wa.me/${phoneNumber}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`
        window.open(waUrl, '_blank')
    }

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-24 md:bottom-8 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:bg-[#20bd5a] focus:outline-none focus:ring-4 focus:ring-[#25d366]/30"
            aria-label="Chat via WhatsApp"
        >
            <Icon name="chat" size={32} />
        </button>
    )
}

export default WhatsAppFAB
