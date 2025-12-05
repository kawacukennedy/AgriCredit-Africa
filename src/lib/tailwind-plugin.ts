import plugin from 'tailwindcss/plugin';

export const agricreditPlugin = plugin(
  function ({ addUtilities, addComponents, theme }) {
    // Add custom utilities
    addUtilities({
      '.text-balance': {
        'text-wrap': 'balance',
      },
      '.animate-fade-in': {
        animation: 'fadeIn 0.5s ease-in-out',
      },
      '.animate-slide-up': {
        animation: 'slideUp 0.3s ease-out',
      },
    });

    // Add custom components
    addComponents({
      '.btn-primary': {
        backgroundColor: theme('colors.agri-green'),
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        fontWeight: '600',
        transition: 'all 0.2s',
        '&:hover': {
          backgroundColor: theme('colors.agri-green/90'),
          transform: 'translateY(-1px)',
        },
      },
      '.card-agri': {
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        padding: '1.5rem',
      },
    });
  },
  {
    theme: {
      extend: {
        colors: {
          'agri-green': '#22c55e',
          'agri-blue': '#3b82f6',
          'agri-yellow': '#f59e0b',
          'slate-gray': '#475569',
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
        },
        animation: {
          'fadeIn': 'fadeIn 0.5s ease-in-out',
          'slideUp': 'slideUp 0.3s ease-out',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
        },
      },
    },
  }
);