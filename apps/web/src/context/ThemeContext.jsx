import { createContext, useContext, useState, useEffect } from 'react'
import { settingsApi } from '../api/client'

const ThemeContext = createContext()

/**
 * ThemeProvider - Manages dynamic theme colors from settings
 */
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState({
        primary: '#10b981',
        accent: '#f97316'
    })

    // Fetch theme settings on mount
    useEffect(() => {
        const fetchTheme = async () => {
            try {
                const response = await settingsApi.getAll()
                const data = response.data

                if (data && typeof data === 'object') {
                    const newTheme = {
                        primary: data.theme_primary || '#10b981',
                        accent: data.theme_accent || '#f97316'
                    }
                    setTheme(newTheme)
                    applyTheme(newTheme)
                }
            } catch (err) {
                console.log('Using default theme')
            }
        }
        fetchTheme()
    }, [])

    // Apply theme colors to CSS variables
    const applyTheme = (themeColors) => {
        const root = document.documentElement

        // Primary color
        root.style.setProperty('--color-primary', themeColors.primary)
        root.style.setProperty('--color-primary-light', adjustColor(themeColors.primary, 20))
        root.style.setProperty('--color-primary-dark', adjustColor(themeColors.primary, -20))

        // Accent color
        root.style.setProperty('--color-accent', themeColors.accent)
    }

    // Helper to lighten/darken a hex color
    const adjustColor = (hex, percent) => {
        const num = parseInt(hex.replace('#', ''), 16)
        const amt = Math.round(2.55 * percent)
        const R = Math.max(Math.min((num >> 16) + amt, 255), 0)
        const G = Math.max(Math.min((num >> 8 & 0x00FF) + amt, 255), 0)
        const B = Math.max(Math.min((num & 0x0000FF) + amt, 255), 0)
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)
    }

    // Update theme (called from settings page)
    const updateTheme = (newTheme) => {
        setTheme(newTheme)
        applyTheme(newTheme)
    }

    return (
        <ThemeContext.Provider value={{ theme, updateTheme, applyTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export default ThemeContext
