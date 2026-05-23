import path from "path";
import { existsSync, readFileSync } from "fs";
import { pool } from "./index";

function findMigrationsFolder(): string | null {
  const candidates = [
    path.join(__dirname, "migrations"),
    path.join(__dirname, "..", "..", "..", "lib", "db", "migrations"),
  ];
  return candidates.find((p) => existsSync(path.join(p, "meta", "_journal.json"))) ?? null;
}

/**
 * Run all pending SQL migrations directly against the DB.
 *
 * Tracks which migrations have been applied in a simple custom table.
 * Each statement is run with IF NOT EXISTS / IF EXISTS guards where possible,
 * and duplicate-object errors (42P07, 42710) are silently ignored so the
 * server can start even when the DB was previously set up via drizzle-kit push.
 */
export async function runMigrations(): Promise<void> {
  const migrationsFolder = findMigrationsFolder();

  if (!migrationsFolder) {
    console.log("ℹ️ No migrations folder — skipping auto-migration");
    return;
  }

  const client = await pool.connect();
  try {
    // Ensure our own migration tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.__migrations (
        id SERIAL PRIMARY KEY,
        tag TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
    const journal = JSON.parse(readFileSync(journalPath, "utf-8")) as {
      entries: Array<{ idx: number; tag: string; when: number }>;
    };

    for (const entry of journal.entries) {
      // Skip if already recorded in our tracking table
      const already = await client.query(
        `SELECT 1 FROM public.__migrations WHERE tag = $1`,
        [entry.tag],
      );
      if ((already.rowCount ?? 0) > 0) {
        console.log(`⏭️  Migration "${entry.tag}" already applied — skipping`);
        continue;
      }

      const sqlFile = path.join(migrationsFolder, `${entry.tag}.sql`);
      if (!existsSync(sqlFile)) {
        console.warn(`⚠️  SQL file for migration "${entry.tag}" not found — skipping`);
        continue;
      }

      const rawSql = readFileSync(sqlFile, "utf-8");

      // Split on drizzle's statement-breakpoint marker and plain semicolons
      const statements = rawSql
        .split(/-->[ \t]*statement-breakpoint/i)
        .flatMap((chunk) => chunk.split(/;\s*\n/))
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      console.log(`🔄 Applying migration "${entry.tag}" (${statements.length} statements)...`);

      for (const stmt of statements) {
        try {
          await client.query(stmt);
        } catch (err: unknown) {
          const pgErr = err as { code?: string };
          if (pgErr.code === "42P07" || pgErr.code === "42710") {
            // Relation / constraint already exists — safe to skip
            continue;
          }
          throw err;
        }
      }

      // Record this migration as applied
      await client.query(
        `INSERT INTO public.__migrations (tag) VALUES ($1) ON CONFLICT (tag) DO NOTHING`,
        [entry.tag],
      );
      console.log(`✅ Migration "${entry.tag}" applied successfully`);
    }
  } finally {
    client.release();
  }
}
