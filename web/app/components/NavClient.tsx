'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SanityNavLink } from '@/types/sanity'

interface NavClientProps {
	navLinks: SanityNavLink[]
}

export default function NavClient({ navLinks }: NavClientProps) {
	const [scrolled, setScrolled] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)

	useEffect(() => {
		const handleScroll = () => setScrolled(window.scrollY > 20)
		window.addEventListener('scroll', handleScroll, { passive: true })
		return () => window.removeEventListener('scroll', handleScroll)
	}, []) 

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				scrolled ? 'bg-[rgba(10,10,10,0.92)] backdrop-blur-md' : 'bg-transparent'
			}`}
		>
			<div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">

				{/* Logo */}
				<Link
					href="/"
					className="font-display font-bold text-[28px] text-c58-white uppercase tracking-[0.04em] hover:text-c58-ice transition-colors duration-200"
				>
					C58
				</Link>

				{/* Desktop nav */}
				<nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="font-body text-label uppercase tracking-[0.15em] text-c58-white hover:text-c58-ice transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-c58-ice focus-visible:outline-offset-4"
						>
							{link.label}
						</Link>
					))}
				</nav>

				{/* Hamburger */}
				<button
					className="md:hidden flex flex-col justify-center gap-[6px] w-8 h-8 focus-visible:outline-2 focus-visible:outline-c58-ice focus-visible:outline-offset-4"
					onClick={() => setMenuOpen(!menuOpen)}
					aria-label={menuOpen ? 'Close menu' : 'Open menu'}
					aria-expanded={menuOpen}
				>
					<span className={`block w-full bg-c58-white transition-all duration-300 ${menuOpen ? 'h-px rotate-45 translate-y-[7px]' : 'h-px'}`} /> {/*verify this animation*/}
					<span className={`block w-full h-px bg-c58-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
					<span className={`block w-full bg-c58-white transition-all duration-300 ${menuOpen ? 'h-px -rotate-45 -translate-y-[7px]' : 'h-px'}`} />
				</button>
			</div>

			{/* Mobile overlay */}
			{menuOpen && (
				<div className="md:hidden fixed inset-0 bg-c58-black z-40 flex flex-col items-center justify-center gap-12">
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							onClick={() => setMenuOpen(false)}
							className="font-display font-bold text-[clamp(2.25rem,8vw,4rem)] uppercase tracking-[0.04em] text-c58-white hover:text-c58-ice transition-colors duration-200"
						>
							{link.label}
						</Link>
					))}
				</div>
			)}
		</header>
	)
}
