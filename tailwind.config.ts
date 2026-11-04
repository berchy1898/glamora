import type { Config } from 'tailwindcss';
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink:'#171514', wine:'#741B2B', champagne:'#D9B9A4', ivory:'#F7F4EF', muted:'#82766D' }, fontFamily: { editorial:['Georgia','Times New Roman','serif'] } } }, plugins: [] } satisfies Config;
