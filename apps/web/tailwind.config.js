/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#10b77f",
                "primary-dark": "#0e9f6e",
                "accent": "#f97316",
                "accent-orange": "#f97316",
                "background-light": "#f8fcfa",
                "background-dark": "#10221c",
                "card-light": "#ffffff",
                "card-dark": "#183028",
                "surface-light": "#ffffff",
                "surface-dark": "#1a2c26",
                "text-main-light": "#0d1b17",
                "text-main-dark": "#e7f3ef",
                "text-muted-light": "#4c9a80",
                "text-muted-dark": "#8ebfb0",
                "border-color": "#e7f3ef",
                "input-border": "#cfe7df",
            },
            fontFamily: {
                "display": ["Plus Jakarta Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
