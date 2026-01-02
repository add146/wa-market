import Icon from './Icon'
import { useSetting } from '../../hooks/useSettings'

/**
 * Logo - Dynamic store logo component
 */
function Logo({ showText = true }) {
    const { data: storeName } = useSetting('store_name')

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
                <Icon name="storefront" size={28} className="text-primary" />
            </div>
            {showText && (
                <h2 className="hidden text-xl font-bold tracking-tight text-text-main-light dark:text-white md:block">
                    {storeName || 'TokoIndo'}
                </h2>
            )}
        </div>
    )
}

export default Logo
