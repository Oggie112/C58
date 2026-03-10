import type { Metadata } from "next";
import { Barlow_Condensed, DM_Mono } from "next/font/google";
import "./globals.css";
import Nav from "./components/Nav";

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

export const metadata: Metadata = {
	title: "C58 — Courtyard 58",
	description: "DJ events and pop-up bars rooted in St Neots.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${barlowCondensed.variable} ${dmMono.variable}`}>
				<Nav />
				{children}
			</body>
		</html>
	);
}
