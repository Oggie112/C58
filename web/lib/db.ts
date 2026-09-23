import postgres from 'postgres'

if (!process.env.DATABASE_POOLED_URL) {
	throw new Error('DATABASE_POOLED_URL is not set')
}

// Singleton, mirrors sanity/client.ts. DATABASE_POOLED_URL is Supabase's
// transaction-pooler connection string (port 6543) — suited to serverless,
// where each invocation would otherwise open its own direct connection.
export const sql = postgres(process.env.DATABASE_POOLED_URL)
