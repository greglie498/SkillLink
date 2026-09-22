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
        },
        slate: {
          dark: '#2D3142',
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
      spacing: {
        // Tailwind's default scale is already 4px-based (1=4px, 2=8px, etc.)
        // so multiples of 2 (2,4,6,8,12) line up with your 8px base unit.
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
  plugins: [],
}