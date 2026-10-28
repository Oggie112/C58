import type { Metadata } from "next";
import { Barlow_Condensed, DM_Mono } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import "./globals.css";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import { SanityLive } from "@/sanity/live";
import { DisableDraftMode } from "./components/DisableDraftMode";
import RedactedAnalytics from "./components/RedactedAnalytics";

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

// Pages are prerendered, and the upcoming/past event lists compare against
// today's date (sanity/fetch.ts) — without a time-based revalidation they'd
// stay frozen at the last build or publish. Hourly re-renders roll them over;
// fetches whose params haven't changed still hit the data cache, so this
// costs no extra Sanity requests. Becomes cacheLife('hours') once
// cacheComponents is on (route segment config is incompatible with it).
export const revalidate = 3600

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const { isEnabled: isDraftMode } = await draftMode()

	return (
		<html lang="en">
			<body className={`${barlowCondensed.variable} ${dmMono.variable}`}>
				<Nav />
				{children}
				<Footer />
				<SanityLive />
				<RedactedAnalytics />
				{isDraftMode && (
					<>
						<VisualEditing />
						<DisableDraftMode />
					</>
				)}
			</body>
		</html>
	);
}
