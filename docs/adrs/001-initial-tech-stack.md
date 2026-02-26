# ADR 001 — Initial Tech Stack

**Date:** 2026-02-25
**Status:** Accepted

## Context

C58 is a landing page for a non-technical client's events business. The priority is a fast, publicly deployed site with content the client can manage without developer involvement. Sanity provides a clean editing interface, and Next.js handles both the frontend and any server-side needs without a separate backend.

## Decision

Next.js + React + TypeScript for the application layer. Next.js gives us SSR/SSG out of the box, which suits a content-driven landing page well. React ecosystem is well-supported for frontend work.

Tailwind CSS for styling — utility-first, fast to build with, and consistent with the wider ecosystem.

Sanity as the CMS and primary data layer. Sanity Studio gives the client a customisable editing interface. No separate database needed — Sanity handles persistence, querying (GROQ), and CDN delivery.

Axios for data fetching from Sanity's API endpoints.

Jest for testing. Familiar, well-documented, integrates cleanly with Next.js.

npm as package manager for simplicity and universal compatibility.

## Consequences

- No separate database to manage — reduces ops burden for a landing page
- Sanity's free tier covers early-stage and likely production usage at this scale
- Vercel is the natural deployment target for Next.js — minimal config needed
- If data needs grow complex, Sanity may need supplementing with a proper database
- Jest coverage on data-fetching logic is a goal for M2
