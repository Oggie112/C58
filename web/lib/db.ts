import postgres from 'postgres'

if (!process.env.DATABASE_POOLED_URL) {
	throw new Error('DATABASE_POOLED_URL is not set')
}

// Singleton, mirrors sanity/client.ts. DATABASE_POOLED_URL is Supabase's
// transaction-pooler connection string (port 6543) — suited to serverless,
// where each invocation would otherwise open its own direct connection.
export const sql = postgres(process.env.DATABASE_POOLED_URL)

// The `postgres` package exports these only inside its namespace, not as
// plain named exports — re-exported here so other files can just
// `import type { SqlClient } from './db'` without knowing that quirk.
//
// ISql, not Sql: Sql (the top-level client) and TransactionSql (what
// `sql.begin(async tx => ...)` hands you) are siblings, not one a subtype of
// the other — Sql alone is missing from TransactionSql's shape (you can't
// `.end()` a connection or open a *new* top-level transaction from inside
// one). ISql is the shared base both extend — the actual "can run a tagged
// template query" capability — which is all functions like
// sweepStaleReservations need, so they work identically whether called
// standalone or inside a caller's transaction.
export type SqlClient = postgres.ISql
