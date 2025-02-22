import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', "sans-serif"],
        playpen: ['"Playpen Sans"', "sans-serif"],
      },
      colors:{
        text: '#473c38',
        white: '#f1efd8',
        accent: '#ebb4bc',
        secondary: '#3d4e52',
        background: '#5e7a80',
      },
    },
  },
  plugins: [],
} satisfies Config;
