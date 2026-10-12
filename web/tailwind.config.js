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
      borderRadius: {
        DEFAULT: "6px",
        "brand-card": "0.5rem", // 8px Glider standard
      },
      boxShadow: {
        "brand-soft":
          "0px 0px 6px rgba(0,0,0,0.02), 0px 2px 2px rgba(0,0,0,0.04)",
        "brand-glass": "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
      },
      spacing: {
        "header-h": "80px",
        "touch-target": "48px",
      },
      maxWidth: {
        "brand-container": "1440px",
        "brand-utility": "400px",
      },
      colors: {
        background: "var(--geist-background)",
        foreground: "var(--geist-foreground)",
        "brand-border": "var(--brand-border)",
        "brand-border-subtle": "var(--brand-border-subtle)",
        "brand-glass": "var(--brand-glass)",
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
      transitionTimingFunction: {
        "brand-ease": "ease-in-out",
      },
      transitionDuration: {
        "brand-speed": "200ms",
      },
    },
  },
  plugins: [],
};
