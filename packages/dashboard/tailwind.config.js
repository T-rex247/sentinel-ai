/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sentinel: {
          bg: "#0a0e1a",
          card: "#111827",
          border: "#1f2937",
          accent: "#14f195",
          purple: "#9945ff",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
