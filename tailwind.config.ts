/** @type {import('tailwindcss').Config} */
import daisyui from "daisyui";
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,vue}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["lemonade"],
  },
};

export default config;
