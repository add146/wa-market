import { Header, MobileNav, WhatsAppFAB } from '../organisms'

/**
 * MainLayout - Main page layout wrapper with header, footer, and navigation
 */
function MainLayout({ children }) {
    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden">
            <Header />

            <main className="flex flex-1 flex-col items-center px-4 py-6 md:px-8 pb-20 md:pb-6">
                <div className="flex w-full max-w-[1200px] flex-col gap-8">
                    {children}
                </div>
            </main>

            <WhatsAppFAB />
            <MobileNav />
        </div>
    )
}

export default MainLayout
