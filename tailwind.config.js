/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      height: {
        'svh': '100svh',
      },
      colors: {
        // Theme-aware colors using CSS variables
        // Usage: bg-theme-primary, text-theme-primary, border-theme
        theme: {
          'bg-primary': 'var(--bg-primary)',
          'bg-secondary': 'var(--bg-secondary)',
          'bg-tertiary': 'var(--bg-tertiary)',
          'surface': 'var(--surface)',
          'surface-elevated': 'var(--surface-elevated)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-tertiary': 'var(--text-tertiary)',
          'border': 'var(--border)',
          'border-hover': 'var(--border-hover)',
          'accent': 'var(--accent)',
          'accent-hover': 'var(--accent-hover)',
        },
        // Semantic color aliases for easier usage
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        border: {
          DEFAULT: 'var(--border)',
          hover: 'var(--border-hover)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
          dark: 'var(--accent-dark)',
        },
        // Keep primary for backward compatibility (maps to accent)
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c', // Main accent
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      boxShadow: {
        DEFAULT: '0 1px 3px 0 var(--shadow)',
        md: '0 4px 6px -1px var(--shadow)',
        lg: '0 10px 15px -3px var(--shadow-lg)',
      },
    },
  },
  plugins: [],
}

