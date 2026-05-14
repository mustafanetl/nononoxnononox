import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          hover: "hsl(var(--sidebar-hover))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 hsl(var(--primary) / 0)" },
          "50%": { boxShadow: "0 0 0 6px hsl(var(--primary) / 0.15)" },
        },
        "pin-bounce": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "ring-fill": {
          from: { strokeDashoffset: "283" },
          to: { strokeDashoffset: "0" },
        },
        "promo-slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
        "promo-slide-out-left": {
          from: { transform: "translateX(0)", opacity: "1" },
          to: { transform: "translateX(-100%)", opacity: "0" },
        },
        "promo-punch-in": {
          from: { transform: "scale(0.5)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "promo-fade-up": {
          from: { transform: "translateY(20px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "promo-glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px 2px rgba(212, 175, 55, 0.3)" },
          "50%": { boxShadow: "0 0 40px 8px rgba(212, 175, 55, 0.6)" },
        },
        "promo-text-glow": {
          "0%, 100%": { textShadow: "0 0 10px rgba(212, 175, 55, 0.4)" },
          "50%": { textShadow: "0 0 30px rgba(212, 175, 55, 0.8)" },
        },
        "promo-underline": {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        "promo-fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "promo-fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 1.5s ease-in-out 3",
        "pin-bounce": "pin-bounce 0.6s ease-in-out",
        "ring-fill": "ring-fill 1.2s ease-out forwards",
        "promo-slide-in": "promo-slide-in-right 0.5s ease-out forwards",
        "promo-slide-out": "promo-slide-out-left 0.5s ease-out forwards",
        "promo-punch": "promo-punch-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "promo-fade-up": "promo-fade-up 0.8s ease-out forwards",
        "promo-glow": "promo-glow-pulse 2s ease-in-out infinite",
        "promo-text-glow": "promo-text-glow 2s ease-in-out infinite",
        "promo-underline": "promo-underline 0.8s ease-out forwards",
        "promo-fade-in": "promo-fade-in 0.8s ease-out forwards",
        "promo-fade-out": "promo-fade-out 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
