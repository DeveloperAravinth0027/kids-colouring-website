/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B6B',
          light: '#FF8E8E',
          dark: '#E55A5A',
        },
        secondary: {
          DEFAULT: '#FFD93D',
          light: '#FFE47A',
          dark: '#E5C337',
        },
        blue: {
          DEFAULT: '#4D96FF',
          light: '#7BB3FF',
          dark: '#3A7DDB',
        },
        green: {
          DEFAULT: '#6BCB77',
          light: '#91D99A',
          dark: '#54B260',
        },
        purple: {
          DEFAULT: '#9B5DE5',
          light: '#B788ED',
          dark: '#8248CA',
        },
        background: '#F9FAFB',
        surface: '#FFFFFF',
      },
      fontFamily: {
        sans: ['"Nunito"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['"Fredoka One"', '"Nunito"', 'cursive', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'float': '0 20px 40px -10px rgba(0,0,0,0.12)',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'float': 'float 4s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        }
      }
    },
  },
  plugins: [],
}
