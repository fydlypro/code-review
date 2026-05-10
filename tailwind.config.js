/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Royal Blue
        fydly: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#0F172A',
        },
        // Violet accent (gradient)
        violet: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        // Slate — neutral surfaces & text
        slate: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        // Semantic
        success: {
          light:   '#D1FAE5',
          DEFAULT: '#059669',
          dark:    '#047857',
        },
        warning: {
          light:   '#FEF3C7',
          DEFAULT: '#D97706',
        },
        error: {
          light:   '#FEE2E2',
          DEFAULT: '#DC2626',
        },
      },
      fontFamily: {
        sans:    ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Inter Display"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'sm':          '0 1px 2px rgba(0,0,0,0.04)',
        'card':        '0 4px 12px rgba(0,0,0,0.06)',
        'card-hover':  '0 8px 24px rgba(0,0,0,0.10)',
        'modal':       '0 24px 64px rgba(0,0,0,0.12)',
        'focus':       '0 0 0 3px rgba(37,99,235,0.15)',
        'glow-blue':   '0 0 40px rgba(37,99,235,0.18)',
        'glow-strong': '0 12px 40px rgba(37,99,235,0.28)',
        'inner':       'inset 0 2px 4px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        'card':   '20px',
        'btn':    '12px',
        'input':  '12px',
        'modal':  '28px',
        'badge':  '100px',
        'avatar': '14px',
      },
      backgroundImage: {
        'gradient-bv':      'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        'gradient-bv-soft': 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceStamp: {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '60%':  { transform: 'scale(1.15)' },
          '80%':  { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(37,99,235,0.4)' },
          '50%':      { boxShadow: '0 0 0 10px rgba(37,99,235,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in':      'fadeIn 300ms ease',
        'bounce-stamp': 'bounceStamp 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up':     'slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow':   'pulseGlow 2.4s ease-out infinite',
        'float':        'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
