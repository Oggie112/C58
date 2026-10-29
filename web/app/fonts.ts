import { Barlow_Condensed, DM_Mono } from "next/font/google";

// Shared by layout.tsx and global-error.tsx — global-error replaces the root
// layout entirely, so it has to load the fonts itself.
const barlowCondensed = Barlow_Condensed({
	subsets: ["latin"],
	weight: ["600", "700"],
	variable: "--font-display",
});

const dmMono = DM_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-body",
});

// Apply to <body> so the --font-display / --font-body variables resolve
export const fontVariables = `${barlowCondensed.variable} ${dmMono.variable}`;
