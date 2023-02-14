/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
  darkMode: "class", // or 'media' or 'class
  theme: {
    extend: {
      colors: {
        "mastodon-gray": {
          200: "#9baec8",
          400: "#313543",
          800: "#1f232b",
        },
        "mastodon-purple": {
          DEFAULT: "#6364FF",
          50: "#FAFAFF",
          100: "#F2F2FF",
          200: "#CECEFF",
          300: "#AAABFF",
          400: "#8787FF",
          500: "#6364FF",
          600: "#4849D3",
          700: "#2A2BA9",
          800: "#1D1D6F",
          900: "#0F0F36",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/line-clamp"),
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@kobalte/tailwindcss"),
  ],
};
