/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        bg2: 'var(--bg-2)',
        panel: 'var(--panel)',
        panel2: 'var(--panel2)',
        panel3: 'var(--panel3)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        line: 'var(--line)',
        board: 'var(--board)',
        gridline: 'var(--grid-line)',
        wall: 'var(--wall)',
        rayr: 'var(--ray-r)',
        rayg: 'var(--ray-g)',
        rayb: 'var(--ray-b)',
      },
      borderRadius: {
        panel: 'var(--radius-panel)',
        button: 'var(--radius-button)',
        cell: 'var(--radius-cell)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'Segoe UI', 'PingFang SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
