/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#FF6B4A',
          dark: '#E85A3A',
          tint: '#FFF1ED',
          light: '#FFD9CF',
        },
        slate: {
          dark: '#2D3142',
          deep: '#1E2130',
        },
        surface: '#F7F7F9',
        border: '#E4E4E9',
        muted: '#8A8A94',
        ink: '#1C1C21',
        success: '#2FA86A',
        warning: '#E8A83A',
        error: '#DB4C4C',
        info: '#3B82C4',
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(30,33,48,.03), 0 8px 28px rgba(30,33,48,.05)',
        lift: '0 2px 4px rgba(30,33,48,.04), 0 16px 40px rgba(30,33,48,.10)',
      },
    },
  },
  plugins: [],
}