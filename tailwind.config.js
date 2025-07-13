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
        'light-purple': '#D9CBFE',
        'light-text-dark': '#2E0927',
        
        'dark-bg-primary': '#1A1A22',    
        'dark-bg-secondary': '#282830',  
        'dark-bg-tertiary': '#363640',   
        'dark-accent-purple': '#796CD6', 
        
        'dark-text-light': '#E0E0E0',    
        'dark-text-medium': '#B0B0B0',  
        'dark-text-dark': '#808080',     
        
        'admin-light-primary': '#374151',    
        'admin-light-hover': '#4B5563',      
        'admin-light-active': '#1F2937',     
        'admin-light-text': '#FFFFFF',       

        'admin-dark-primary': '#1A1A1A',     
        'admin-dark-secondary': '#2A2A2A',   
        'admin-dark-tertiary': '#3A3A3A',    
        'admin-accent-green': '#00C853',     
        'admin-dark-text': '#E0E0E0',        
      },
    },
  },
  plugins: [],
}