/**
 * AdminAvatar - Profile avatar for admin panel
 */
function AdminAvatar({ src, alt = 'User Profile', size = 'md' }) {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12'
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`${sizeClasses[size]} rounded-full border-2 border-slate-100 dark:border-slate-700 object-cover`}
        />
    )
}

export default AdminAvatar
