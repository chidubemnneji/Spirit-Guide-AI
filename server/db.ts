import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Enforce TLS on the Postgres connection at the app level in production,
// rather than relying on whatever the current network path happens to
// provide (e.g. a private-network link that's encrypted in a different way).
// `rejectUnauthorized: false` — not `true` — is deliberate: most managed
// Postgres providers (Railway included) terminate TLS with a certificate
// that isn't signed by a CA in Node's default trust store, so strict
// verification fails the handshake outright rather than "being more
// secure." This still gets a fully encrypted connection; it just doesn't
// pin the server certificate. Skipped entirely outside production so local
// dev Postgres (which usually isn't configured for SSL at all) keeps
// working unchanged.
export const pgSSLConfig =
  process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  keepAlive: true,
  ssl: pgSSLConfig,
});

export const db = drizzle(pool, { schema });
