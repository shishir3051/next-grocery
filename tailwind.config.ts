import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00b14f", // Chaldal Green
          hover: "#00913f",
          light: "#e6f8ef",
        },
        secondary: {
          DEFAULT: "#ed1c24", // Shwapno Red
          hover: "#cc181f",
          light: "#fde8e9",
        },
        accent: "#ff8c00", // Warm Orange for deals
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
