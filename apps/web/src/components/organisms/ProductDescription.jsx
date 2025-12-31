import { Icon } from '../atoms'

/**
 * ProductDescription - Product info card with description and features list
 */
function ProductDescription({ description = '', features = [] }) {
    return (
        <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-surface-dark dark:shadow-none dark:border dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
                <Icon name="description" size={24} className="text-slate-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Deskripsi Produk
                </h3>
            </div>
            <div className="prose prose-sm text-slate-600 dark:text-slate-300">
                <p>{description}</p>
                {features.length > 0 && (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        {features.map((feature, index) => (
                            <li key={index}>{feature}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default ProductDescription
