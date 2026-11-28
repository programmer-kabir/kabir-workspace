/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        store: {
          dark: '#0A2E20',       // Deep Forest Green (Top bar & active states)
          primary: '#124E38',    // Master Emerald Green (Brand color from image)
          primaryHover: '#0E3E2D',
          accent: '#10B981',     // Vibrant Fresh Green (Buttons & highlights)
          accentLight: '#E8F5E9',
          cream: '#F4F7F4',      // Soft off-white/cream hero background
          card: '#F6F7F9',       // Clean soft gray for product & category cards
          border: '#E5E7EB',
          textMuted: '#6B7280',
          orange: '#F97316',
        },
      },
      fontFamily: {
        bangla: ['var(--font-siliguri)', 'Hind Siliguri', 'sans-serif'],
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
