/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                marquee: {
                    '0%': { transform: 'translateX(0%)' },
                    '100%': { transform: 'translateX(-50%)' }, // Move 50% (one full set width) to left for seamless loop
                },
            },
            animation: {
                marquee: 'marquee 25s linear infinite',
            },
        },
    },
    plugins: [],
}
