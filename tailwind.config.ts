import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // src/ klasörü altındaki tüm bileşen ve sayfa dosyaları
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // globals.css'deki CSS değişkenlerini Tailwind class'larına bağlar
      // Örn: --border var'ı → border-border class'ı kullanılabilir olur
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        primary: { DEFAULT: "var(--primary)", foreground: "var(--primary-foreground)" },
        secondary: { DEFAULT: "var(--secondary)", foreground: "var(--secondary-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        accent: { DEFAULT: "var(--accent)", foreground: "var(--accent-foreground)" },
        destructive: { DEFAULT: "var(--destructive)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: { DEFAULT: "var(--sidebar-primary)", foreground: "var(--sidebar-primary-foreground)" },
          accent: { DEFAULT: "var(--sidebar-accent)", foreground: "var(--sidebar-accent-foreground)" },
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        // design.md → rounded.DEFAULT: 0.5rem, lg: 1rem, xl: 1.5rem
        sm: "var(--radius)",
        md: "calc(var(--radius) + 0.25rem)",
        lg: "calc(var(--radius) + 0.5rem)",
        xl: "calc(var(--radius) + 1rem)",
      },
      fontFamily: {
        // Inter font: globals.css'deki --font-sans değişkenine bağlı
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
