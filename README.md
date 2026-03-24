# C58

Website for C58 — a St Neots-based events company. Built with Next.js and Sanity CMS, deployed on Vercel.

---

## Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | Next.js 16 (App Router), TypeScript |
| Styling    | Tailwind CSS v4                     |
| CMS        | Sanity Studio v3                    |
| Data layer | next-sanity, GROQ                   |
| Deployment | Vercel                              |

---

## Project Structure

```
c58/
├── web/          # Next.js frontend
├── studio/       # Sanity Studio
└── docs/         # Roadmaps, CMS guide, ADRs
```

---

## Prerequisites

- Node.js 18+
- npm
- Access to the Sanity project

---

## Getting Started

### 1. Clone

```bash
git clone https://github.com/Oggie112/C58.git
cd C58
```

### 2. Install dependencies

```bash
cd web && npm install
cd ../studio && npm install
```

### 3. Configure environment variables

Create `web/.env.local` with the following:

```env
# Sanity project config (safe to expose)
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2023-02-07
NEXT_PUBLIC_SANITY_STUDIO_URL=https://c58.sanity.studio

# Draft Mode — viewer token for live preview (keep secret)
NEXT_PUBLIC_SANITY_VIEWER_TOKEN=your_viewer_token

# API read token — used by Draft Mode route handler (keep secret)
SANITY_API_READ_TOKEN=your_read_token
```

Tokens can be generated in your Sanity project at **sanity.io/manage → API → Tokens**.

- **Viewer token** — `Viewer` permissions
- **Read token** — `Viewer` permissions (used server-side only)

### 4. Run locally

```bash
# Frontend — http://localhost:3000
cd web && npm run dev

# Sanity Studio — http://localhost:3333
cd studio && npm run dev
```

---

## Other Commands

```bash
cd web && npm run build    # Production build
cd web && npm test         # Jest test suite
cd web && npm run lint     # ESLint
```

---

## Deployment

The frontend deploys automatically to Vercel on push to `main`. No manual steps required.

**Required Vercel environment variables** — add the same variables from `web/.env.local` to the Vercel project settings.

The Sanity Studio is deployed at [c58.sanity.studio](https://c58.sanity.studio).

---

## Docs

- [`docs/cms-guide.md`](docs/cms-guide.md) — editor guide for the client
- [`docs/roadmaps/mvp.md`](docs/roadmaps/mvp.md) — project roadmap
