/**
 * Format date to WIB (Waktu Indonesia Barat / UTC+7)
 * All dates in the app should use this utility
 */

const WIB_OPTIONS = { timeZone: 'Asia/Jakarta' }

/**
 * Format date to "28 Mar 2026" style
 */
export function formatDateWIB(date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
        ...WIB_OPTIONS,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

/**
 * Format date to "28 Mar 2026, 15:30" style
 */
export function formatDateTimeWIB(date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
        ...WIB_OPTIONS,
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Format date to "15:30 WIB" style (time only)
 */
export function formatTimeWIB(date) {
    if (!date) return '-'
    return new Date(date).toLocaleTimeString('id-ID', {
        ...WIB_OPTIONS,
        hour: '2-digit',
        minute: '2-digit',
    }) + ' WIB'
}

/**
 * Format relative time like "2 jam lalu", "5 menit lalu"
 */
export function formatRelativeWIB(date) {
    if (!date) return '-'
    const now = new Date()
    const then = new Date(date)
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60000)
    const diffHour = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'Baru saja'
    if (diffMin < 60) return `${diffMin} menit lalu`
    if (diffHour < 24) return `${diffHour} jam lalu`
    if (diffDay < 7) return `${diffDay} hari lalu`
    return formatDateWIB(date)
}
