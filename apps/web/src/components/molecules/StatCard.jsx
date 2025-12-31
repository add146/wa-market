import Icon from '../atoms/Icon'

/**
 * StatCard - Quick stats display card
 */
function StatCard({ title, value, icon, color = 'blue' }) {
    const colorClasses = {
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
        green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
    }

    return (
        <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-slate-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</h3>
            </div>
            <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
                <Icon name={icon} size={24} />
            </div>
        </div>
    )
}

export default StatCard
