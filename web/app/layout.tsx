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
	// metadataBase is required for Next.js to construct absolute URLs for OG images.
	// Set NEXT_PUBLIC_SITE_URL in Vercel environment variables at deploy time,
	// then update it again when a custom domain is configured.
	metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
	title: {
		default: 'C58 — Courtyard 58',
		// Child pages that set a title string will render as e.g. "Events | C58"
		template: '%s | C58',
	},
	description: 'DJ events and pop-up bars rooted in St Neots.',
	openGraph: {
		type: 'website',
		locale: 'en_GB',
		siteName: 'C58 — Courtyard 58',
	},
	twitter: {
		card: 'summary_large_image',
	},
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
