import { CheckoutHeader, CheckoutFooter } from '../organisms'

/**
 * CheckoutPageLayout - Layout for checkout page
 */
function CheckoutPageLayout({ children, onBack }) {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
            <CheckoutHeader onBack={onBack} />
            <main className="flex-grow w-full px-4 sm:px-8 lg:px-40 py-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
            <CheckoutFooter />
        </div>
    )
}

export default CheckoutPageLayout
