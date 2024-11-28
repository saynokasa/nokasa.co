import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
          "hero": "url('/assets/hero-bg.png')",
        "hero1":"url('/assets/bg-1.svg')",
        "hover":"url('/assets/hover.svg')",
        "form":"url('/assets/form.svg')",
      },
      animation: {
        'loop-scroll': 'loop-scroll 20s linear',
      },
      keyframes: {
        'loop-scroll': {
          'from': { transform: 'translateX(calc(100% - 100vw))' },
          'to': { transform: 'translateX(0%)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
