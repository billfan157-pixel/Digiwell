/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cấu hình màu primary chạy bằng "động cơ" CSS Variable
        primary: {
          DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
        }
      }
    },
  },
  plugins: [],
}