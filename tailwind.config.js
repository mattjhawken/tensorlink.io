/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          teal: '#4FD8C4',
          purple: '#A78BFA',
          blue: '#60A5FA',
          amber: '#F59E0B',
          pink: '#F472B6',
          green: '#34D399',
        },
      },
    },
  },
  plugins: [],
}
