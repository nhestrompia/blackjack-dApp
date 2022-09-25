/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // sans: [your_main_font],
        roboto: ["Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
}
