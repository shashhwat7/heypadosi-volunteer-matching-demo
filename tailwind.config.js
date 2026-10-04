/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aws: {
          squid: '#161e2e',
          squidLight: '#232f3e',
          nav: '#0f172a',
          orange: '#ec7211',
          orangeHover: '#eb5f07',
          blue: '#0972d3',
          blueHover: '#035bb0',
          darkBlue: '#004785',
          border: '#e5e7eb',
          panel: '#ffffff',
          bg: '#f8fafc',
          textMuted: '#68707f',
          textDark: '#16191f',
          statusGreen: '#1d8102',
          statusGreenBg: '#f2f8f0',
          statusAmber: '#d17305',
          statusAmberBg: '#fdf7e7',
          statusRed: '#d13212',
          statusRedBg: '#fdf2f2',
          statusBlue: '#0073bb',
          statusBlueBg: '#f1faff'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
