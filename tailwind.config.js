/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts}'],
    theme: {
        extend: {
            colors: {
                ink: '#0a0a0a',
                paper: '#f0ede8',
                muted: '#6b6b6b',
                accent: '#c8ff00',
                'accent-dim': '#a8d900',
                surface: '#141414',
                border: '#1e1e1e',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            fontSize: {
                'display-1': ['clamp(3.5rem, 10vw, 9rem)', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
                'display-2': ['clamp(2.5rem, 6vw, 6rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
                'heading-1': ['clamp(1.75rem, 3vw, 3rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
                'heading-2': ['clamp(1.25rem, 2vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
                'label': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.12em' }],
            },
            spacing: {
                'section': 'clamp(6rem, 15vh, 12rem)',
            },
            transitionTimingFunction: {
                'expo-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
                'expo-in-out': 'cubic-bezier(0.87, 0, 0.13, 1)',
            },
            animation: {
                'spin-slow': 'spin 20s linear infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
        },
    },
    plugins: [],
};
