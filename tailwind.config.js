/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Hull design tokens
        page:    '#f4f4f0',        // --pageBG (light)
        ink:     '#000000',        // --pageText (light)
        'page-dark': '#000000',    // --pageBG (dark)
        'ink-dark':  '#f4f4f0',    // --pageText (dark)

        // Neutral grays (warm-tinted to match #f4f4f0 palette)
        stone: {
          50:  '#fafaf8',
          100: '#f4f4f0',   // pageBG
          150: '#ededea',
          200: '#e5e5e0',
          300: '#d4d4ce',
          400: '#b4b4ac',
          500: '#8a8a84',
          600: '#6b6b65',
          700: '#4a4a45',
          800: '#2a2a26',
          900: '#141410',
          950: '#0a0a08',
        },

        // Accent — used sparingly; deep ink blue for interactive
        accent: {
          DEFAULT: '#000000',
          hover:   '#2a2a26',
          muted:   '#4a4a45',
        },

        // Status colours (muted, not neon)
        success: '#1a6a3a',
        warning: '#8a5a00',
        danger:  '#8a1a1a',
        info:    '#1a3a6a',
      },
      fontFamily: {
        sans:   ['"DM Sans"', 'system-ui', 'sans-serif'],
        serif:  ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',  { lineHeight: '1.125rem' }],
        sm:    ['0.875rem', { lineHeight: '1.375rem' }],
        base:  ['1rem',     { lineHeight: '1.6rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.75rem' }],
        '5xl': ['3rem',     { lineHeight: '3.5rem' }],
        '6xl': ['3.75rem',  { lineHeight: '4.25rem' }],
        '7xl': ['4.5rem',   { lineHeight: '5rem' }],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter:  '-0.025em',
        tight:    '-0.015em',
        normal:   '0em',
        wide:     '0.04em',
        wider:    '0.08em',
        widest:   '0.16em',
      },
      borderColor: {
        DEFAULT: '#000000',
      },
      borderWidth: {
        DEFAULT: '1px',
        '0':     '0',
        '2':     '2px',
      },
    },
  },
  plugins: [],
}
