/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--geist-background)",
        foreground: "var(--geist-foreground)",
        "ds-gray": {
          100: "var(--ds-gray-100)",
          200: "var(--ds-gray-200)",
          400: "var(--ds-gray-400)",
          500: "var(--ds-gray-500)",
          900: "var(--ds-gray-900)",
          1000: "var(--ds-gray-1000)",
        },
        "ds-blue": {
          700: "var(--ds-blue-700)",
          900: "var(--ds-blue-900)",
        },
        geist: {
          success: "var(--geist-success)",
          error: "var(--geist-error)",
          warning: "var(--geist-warning)",
          selection: "var(--geist-selection)",
        },
      },
      fontFamily: {
        outfit: ["var(--font-outfit)", "-apple-system", "sans-serif"],
        satoshi: ["var(--font-satoshi)", "-apple-system", "sans-serif"],
        sans: ["var(--font-satoshi)", "-apple-system", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};
