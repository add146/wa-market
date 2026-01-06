import { useEffect } from 'react'
import { Header, MobileNav, WhatsAppFAB } from '../organisms'
import { useSettings } from '../../hooks/useSettings'

/**
 * MainLayout - Main page layout wrapper with header, footer, and navigation
 */
function MainLayout({ children }) {
    const { data: settings } = useSettings()

    // Update browser tab title from settings
    useEffect(() => {
        const storeName = settings?.store_name || 'TokoIndo'
        const tagline = settings?.store_tagline
        document.title = tagline ? `${storeName} - ${tagline}` : storeName
    }, [settings])

    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
            <Header />

            <main className="flex flex-1 flex-col items-center px-3 py-4 md:px-8 md:py-6 pb-20 md:pb-6">
                <div className="flex w-full max-w-[1200px] flex-col gap-4 md:gap-8">
                    {children}
                </div>
            </main>

            <WhatsAppFAB />
            <MobileNav />
        </div>
    )
}

export default MainLayout
