import { useSetting } from '../../hooks/useSettings'

/**
 * Footer - Footer section with copyright
 */
function Footer() {
    const { data: storeName } = useSetting('store_name')
    const currentYear = new Date().getFullYear()

    return (
        <div className="mt-8 flex flex-col items-center justify-center gap-4 border-t border-[#e7f3ef] dark:border-[#1c3a30] pt-8 text-center">
            <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
                © {currentYear} {storeName || 'TokoIndo'}. Belanja Aman & Hemat via WhatsApp.
            </p>
        </div>
    )
}

export default Footer
