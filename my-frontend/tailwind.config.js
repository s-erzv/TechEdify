/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        dark: { 
          'bg-primary': '#1A1A22',   
          'bg-secondary': '#282830',
          'bg-tertiary': '#363640',
          'accent-purple': '#796CD6',
        },
        adminDark: { 
          'bg-primary': '#1A1A1A',  
          'bg-secondary': '#2A2A2A',
          'bg-tertiary': '#3A3A3A',  
          'accent-green': '#00C853', 
        },
        'light-purple': '#D9CBFE', 
        'light-text-dark': '#2E0927', 
      },
    },
  },
  plugins: [],
}