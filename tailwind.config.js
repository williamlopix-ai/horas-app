/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: { 0:'var(--bg-0)', 1:'var(--bg-1)', 2:'var(--bg-2)', 3:'var(--bg-3)' },
        ink:     { 900:'var(--fg-900)', 700:'var(--fg-700)', 500:'var(--fg-500)', 300:'var(--fg-300)' },
        hair:    { DEFAULT:'var(--hair)', strong:'var(--hair-2)' },
        accent:  { DEFAULT:'var(--accent)', bg:'var(--accent-bg)', fg:'var(--accent-fg)' },
        pri:     { DEFAULT:'var(--pri-bg)', fg:'var(--pri-fg)', hover:'var(--pri-bg-h)' },
        ok:      { DEFAULT:'var(--ok)', bg:'var(--ok-bg)' },
        warn:    { DEFAULT:'var(--warn)', bg:'var(--warn-bg)' },
        bad:     { DEFAULT:'var(--bad)', bg:'var(--bad-bg)' },
        proj:    { 1:'var(--proj-1)', 2:'var(--proj-2)', 3:'var(--proj-3)', 4:'var(--proj-4)',
                   5:'var(--proj-5)', 6:'var(--proj-6)', 7:'var(--proj-7)', 8:'var(--proj-8)',
                   9:'var(--proj-9)', 10:'var(--proj-10)', 11:'var(--proj-11)', 12:'var(--proj-12)' },
      },
      fontFamily: {
        display: ['Instrument Sans','system-ui','sans-serif'],
        ui:      ['Inter Variable','Inter','system-ui','sans-serif'],
        mono:    ['IBM Plex Mono','ui-monospace','monospace'],
      },
      borderRadius: {
        chip:  'var(--r-xs)',
        ctl:   'var(--r-sm)',
        card:  'var(--r-md)',
        sheet: 'var(--r-lg)',
      },
      boxShadow:                { e1:'var(--sh-1)', e2:'var(--sh-2)', e3:'var(--sh-3)' },
      transitionDuration:       { d1:'var(--d1)', d2:'var(--d2)', d3:'var(--d3)' },
      transitionTimingFunction: { ez:'var(--ez)' },
    },
  },
  plugins: [],
}

