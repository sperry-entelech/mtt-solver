/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Futuristic color palette
        cyber: {
          black: '#000000',
          dark: '#0a0a0a',
          'dark-2': '#0f0f0f',
          'dark-3': '#1a1a1a',
          'gray-1': '#2a2a2a',
          'gray-2': '#3a3a3a',
          'gray-3': '#4a4a4a',
        },
        neon: {
          cyan: '#00ffff',
          'cyan-dark': '#00cccc',
          'cyan-light': '#66ffff',
          blue: '#0099ff',
          'blue-dark': '#0077cc',
          'blue-light': '#33aaff',
          green: '#00ff88',
          'green-dark': '#00cc66',
          'green-light': '#33ff99',
          purple: '#8800ff',
          'purple-dark': '#6600cc',
          'purple-light': '#aa33ff',
          pink: '#ff0099',
          'pink-dark': '#cc0077',
          'pink-light': '#ff33aa',
          white: '#ffffff',
          'white-dim': '#f0f0f0',
        },
        // Legacy poker colors for backward compatibility
        poker: {
          green: '#0f5132',
          felt: '#2d5a27',
          gold: '#ffd700',
          red: '#dc2626',
          blue: '#1e40af',
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
          }
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Monaco', 'Consolas', 'monospace'],
        futura: ['Orbitron', 'Exo 2', 'Rajdhani', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'neon-cyan': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff',
        'neon-cyan-lg': '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
        'neon-blue': '0 0 5px #0099ff, 0 0 10px #0099ff, 0 0 15px #0099ff',
        'neon-blue-lg': '0 0 10px #0099ff, 0 0 20px #0099ff, 0 0 30px #0099ff',
        'neon-green': '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 15px #00ff88',
        'neon-green-lg': '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88',
        'neon-purple': '0 0 5px #8800ff, 0 0 10px #8800ff, 0 0 15px #8800ff',
        'neon-purple-lg': '0 0 10px #8800ff, 0 0 20px #8800ff, 0 0 30px #8800ff',
        'neon-white': '0 0 5px #ffffff, 0 0 10px #ffffff, 0 0 15px #ffffff',
        'neon-white-lg': '0 0 10px #ffffff, 0 0 20px #ffffff, 0 0 30px #ffffff',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'pulse-neon': 'pulseNeon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scan-line': 'scanLine 2s linear infinite',
        'data-flow': 'dataFlow 4s linear infinite',
        'hologram': 'hologram 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        pulseNeon: {
          '0%, 100%': {
            opacity: '1',
            filter: 'brightness(1) saturate(1)',
          },
          '50%': {
            opacity: '0.8',
            filter: 'brightness(1.2) saturate(1.3)',
          },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
          },
          '50%': {
            boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        scanLine: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        dataFlow: {
          '0%': { transform: 'translateX(-100%) rotate(0deg)' },
          '100%': { transform: 'translateX(200vw) rotate(360deg)' },
        },
        hologram: {
          '0%, 100%': {
            opacity: '0.8',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.02)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'matrix-rain': 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%)',
        'cyber-grid': `
          linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'cyber-grid': '50px 50px',
      },
    },
  },
  plugins: [],
}