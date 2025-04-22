/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts,js}', // Adjust based on your project structure
  ],
  theme: {
    extend: {
      colors: {
        'custom-blue': '#47d2fc',
        'custom-dark-blue': '#2a86bb',
        'custom-pink': '#f4c2c2',
        'custom-light-pink': '#ffb6c1',
      },
    },
  },
  plugins: [],
};