import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

const config: Config = {
	darkMode: "class",
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				chart: {
					"1": "hsl(var(--chart-1))",
					"2": "hsl(var(--chart-2))",
					"3": "hsl(var(--chart-3))",
					"4": "hsl(var(--chart-4))",
					"5": "hsl(var(--chart-5))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
				"2xl": "1rem",
				"3xl": "1.5rem",
				"4xl": "2rem",
			},
			boxShadow: {
				glass: "0 8px 32px 0 rgba(0, 0, 0, 0.08)",
				"glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.4)",
				neumorphic:
					"6px 6px 12px rgba(0, 0, 0, 0.08), -6px -6px 12px rgba(255, 255, 255, 0.8)",
				"neumorphic-dark":
					"6px 6px 12px rgba(0, 0, 0, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.05)",
				soft: "0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)",
				"soft-dark":
					"0 2px 8px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.2)",
			},
			backgroundImage: {
				"gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
			},
			fontFamily: {
				sans: ["Inter", "system-ui", "sans-serif"],
				mono: ["JetBrains Mono", "Menlo", "monospace"],
			},
			animation: {
				"pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				"fade-in": "fadeIn 0.3s ease-in-out",
				"slide-up": "slideUp 0.3s ease-out",
				spotlight: "spotlight 2s ease 0.75s 1 forwards",
				"meteor-effect": "meteor 5s linear infinite",
			},
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				slideUp: {
					"0%": { transform: "translateY(10px)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				spotlight: {
					"0%": {
						opacity: "0",
						transform: "translate(-72%, -62%) scale(0.5)",
					},
					"100%": {
						opacity: "1",
						transform: "translate(-50%,-40%) scale(1)",
					},
				},
				meteor: {
					"0%": { transform: "rotate(45deg) translateX(0)", opacity: "1" },
					"70%": { opacity: "1" },
					"100%": {
						transform: "rotate(45deg) translateX(-500px)",
						opacity: "0",
					},
				},
			},
		},
	},
	plugins: [
		heroui({
			themes: {
				light: {
					colors: {
						primary: { DEFAULT: "#3B82F6", foreground: "#fff" },
						success: { DEFAULT: "#22C55E" },
						warning: { DEFAULT: "#F59E0B" },
						danger: { DEFAULT: "#EF4444" },
						background: "#F8FAFC",
						foreground: "#0F172A",
					},
				},
				dark: {
					colors: {
						primary: { DEFAULT: "#60A5FA", foreground: "#000" },
						background: "#0F172A",
						foreground: "#F1F5F9",
					},
				},
			},
		}) as any,
		require("tailwindcss-animate"),
	],
};

export default config;
