/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:    '#1F5D3A',
        'primary-dark':  '#174D30',
        'primary-light': '#2E7D52',
        accent:     '#D4AF37',
        'accent-light':  '#E5C55A',
        'accent-dark':   '#B8942A',
        surface:    '#F8F9FA',
        border:     '#E5E7EB',
        muted:      '#6B7280',
        success:    '#10B981',
        warning:    '#F59E0B',
        error:      '#EF4444',
        info:       '#3B82F6',
      },
      fontFamily: {
        sans:  ['System'],
        bold:  ['System'],
      },
    },
  },
  plugins: [],
};
