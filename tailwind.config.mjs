/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]', '[data-theme="high-contrast"]'],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        // Design System Colors from frontend-specs.json
        primary: {
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#4CAF50',
          600: '#43A047',
          700: '#388E3C',
          800: '#2E7D32',
          900: '#1B5E20',
        },
        secondary: {
          50: '#FFFDE7',
          500: '#FFD700',
          900: '#FF6F00',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        success: {
          light: '#00C853',
          dark: '#00E676',
        },
        warning: {
          light: '#FFB300',
          dark: '#FFCA28',
        },
        error: {
          light: '#D32F2F',
          dark: '#F44336',
        },
        info: {
          light: '#1976D2',
          dark: '#2196F3',
        },

        // Shadcn/ui compatible colors with AgriCredit theme
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // Typography from specs.json
        sans: ['Poppins', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        // Typography scale from frontend-specs.json
        h1: ['3rem', { lineHeight: '1.167', letterSpacing: '-0.01562em', fontWeight: '700' }],
        h2: ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.00833em', fontWeight: '600' }],
        h3: ['1.875rem', { lineHeight: '1.167', letterSpacing: '0em', fontWeight: '600' }],
        h4: ['1.5rem', { lineHeight: '1.235', letterSpacing: '0.00735em', fontWeight: '500' }],
        h5: ['1.25rem', { lineHeight: '1.334', letterSpacing: '0em', fontWeight: '500' }],
        h6: ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.0075em', fontWeight: '500' }],
        body_large: ['1.125rem', { lineHeight: '1.556', letterSpacing: '0.00938em', fontWeight: '400' }],
        body_medium: ['1rem', { lineHeight: '1.5', letterSpacing: '0.00938em', fontWeight: '400' }],
        body_small: ['0.875rem', { lineHeight: '1.429', letterSpacing: '0.01071em', fontWeight: '400' }],
        caption: ['0.75rem', { lineHeight: '1.333', letterSpacing: '0.03333em', fontWeight: '400' }],
        overline: ['0.625rem', { lineHeight: '1.6', letterSpacing: '0.08333em', fontWeight: '500' }],
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      spacing: {
        // Spacing scale from frontend-specs.json (base unit: 8px)
        '0': '0px',
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
        '5xl': '96px',
        '6xl': '128px',
      },
      borderRadius: {
        // Border radius scale from frontend-specs.json
        'none': '0px',
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        'full': '9999px',
        // Shadcn compatibility
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Elevation levels from frontend-specs.json
        'level_0': 'none',
        'level_1': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'level_2': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'level_3': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'level_4': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'level_5': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        // Motion from frontend-specs.json
        'instant': '0ms',
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
        'slower': '500ms',
        'deliberate': '1000ms',
        // Animation types
        'fade': 'fade 200ms ease-out',
        'slide_up': 'slideUp 200ms ease-out',
        'slide_down': 'slideDown 200ms ease-out',
        'scale': 'scale 200ms ease-out',
        'rotate': 'rotate 200ms ease-out',
        // Micro animations
        'ai-score-pulse': 'aiScorePulse 600ms ease-in-out',
        'button-press': 'buttonPress 100ms ease-out',
        // Page transitions
        'fade-slide': 'fadeSlide 300ms ease-out',
        'holo-swap': 'holoSwap 600ms ease-out',
        // Loading animations
        'data-shimmer': 'dataShimmer 1400ms ease-in-out infinite',
        'map-pulse': 'mapPulse 2000ms ease-in-out infinite',
      },
      zIndex: {
        // Z-index scale from frontend-specs.json
        'base': 0,
        'dropdown': 1000,
        'sticky': 1020,
        'fixed': 1030,
        'modal_backdrop': 1040,
        'modal': 1050,
        'popover': 1060,
        'tooltip': 1070,
        'toast': 1080,
        'notification': 1090,
        'max': 9999,
      },
      keyframes: {
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)' },
          '100%': { transform: 'translateY(0)' },
        },
        scale: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        aiScorePulse: {
          '0%, 100%': { transform: 'scale(0.98)' },
          '50%': { transform: 'scale(1.02)' },
        },
        buttonPress: {
          '0%': { transform: 'translateY(0)', boxShadow: 'var(--tw-shadow-level1)' },
          '50%': { transform: 'translateY(2px)', boxShadow: 'var(--tw-shadow-level2)' },
          '100%': { transform: 'translateY(0)', boxShadow: 'var(--tw-shadow-level1)' },
        },
        fadeSlide: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        holoSwap: {
          '0%': { opacity: '0', transform: 'scale(0.8)', filter: 'hue-rotate(0deg) brightness(1)' },
          '25%': { opacity: '0.7', transform: 'scale(1.05)', filter: 'hue-rotate(90deg) brightness(1.2)' },
          '50%': { opacity: '1', transform: 'scale(1)', filter: 'hue-rotate(180deg) brightness(1.1)' },
          '75%': { opacity: '0.9', transform: 'scale(0.98)', filter: 'hue-rotate(270deg) brightness(1.3)' },
          '100%': { opacity: '1', transform: 'scale(1)', filter: 'hue-rotate(360deg) brightness(1)' },
        },
        dataShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        mapPulse: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.2)', opacity: '0.7' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      screens: {
        // Grid system breakpoints from frontend-specs.json
        'xs': { 'min': '0px', 'max': '599px' },
        'sm': { 'min': '600px', 'max': '959px' },
        'md': { 'min': '960px', 'max': '1279px' },
        'lg': { 'min': '1280px', 'max': '1919px' },
        'xl': { 'min': '1920px', 'max': 'infinity' },
      },
    },
  },
  plugins: [],
}