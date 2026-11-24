import fs from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'
import { PostgreSqlContainer } from '@testcontainers/postgresql'

type DbClient = typeof import('@/lib/db').sql

export interface TestDatabase {
	sql: DbClient
	stop: () => Promise<void>
}

// Throwaway Postgres for DB-backed tests: starts a container, points
// DATABASE_POOLED_URL at it, applies every migration in order, and returns
// the app's own `sql` singleton connected to it. Docker is the only
// requirement — no externally-provided database.
//
// lib/db.ts reads DATABASE_POOLED_URL at module-load time, so any module
// under test that imports it (directly or transitively) must be imported
// dynamically, *after* this resolves — a static top-level import would
// evaluate first and throw. Call from beforeAll with a generous timeout
// (container start-up), and `stop` from afterAll.
export async function startTestDatabase(): Promise<TestDatabase> {
	const container = await new PostgreSqlContainer('postgres:16').start()
	process.env.DATABASE_POOLED_URL = container.getConnectionUri()

	const { sql } = await import('@/lib/db')

	// Migrations run on their own connection that ignores notices — the
	// pg_cron/pg_net migrations raise one when they skip themselves here,
	// which would otherwise be printed to the console by every DB suite
	const migrator = postgres(container.getConnectionUri(), { onnotice: () => {} })
	const migrationsDir = path.resolve(__dirname, '../../../supabase/migrations')
	const migrationFiles = fs
		.readdirSync(migrationsDir)
		.filter((file) => file.endsWith('.sql'))
		.sort()
	for (const file of migrationFiles) {
		await migrator.file(path.join(migrationsDir, file))
	}
	await migrator.end()

	return {
		sql,
		stop: async () => {
			await sql.end()
			await container.stop()
		},
	}
}
