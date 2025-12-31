import { TrustBadge } from '../molecules'

/**
 * TrustBadges - Grid of trust indicator badges
 */
function TrustBadges() {
    const badges = [
        { icon: 'verified_user', label: 'Aman & Terpercaya' },
        { icon: 'bolt', label: 'Proses Cepat' },
        { icon: 'support_agent', label: 'CS 24/7' },
    ]

    return (
        <div className="grid grid-cols-3 gap-4 text-center">
            {badges.map((badge) => (
                <TrustBadge
                    key={badge.icon}
                    icon={badge.icon}
                    label={badge.label}
                />
            ))}
        </div>
    )
}

export default TrustBadges
