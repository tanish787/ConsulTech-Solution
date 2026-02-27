module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#059669",
        secondary: "#10b981",
        accent: "#f59e0b",
        dark: "#1a1a1a",
        light: "#f9fafb",
      },
      spacing: {
        "128": "32rem",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#1a1a1a",
            lineHeight: "1.6",
          },
        },
      },
    },
  },
  plugins: [],
};
