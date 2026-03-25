import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

type PgPoolArg = ConstructorParameters<typeof PrismaPg>[0];

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Query params that make node-pg enforce strict TLS (often conflicting with `ssl` on PoolConfig). */
const PG_SSL_QUERY_PARAMS = [
  "sslmode",
  "sslrootcert",
  "sslcert",
  "sslkey",
  "uselibpqcompat",
] as const;

function stripSslQueryParams(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    for (const key of PG_SSL_QUERY_PARAMS) {
      url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Relaxed TLS: encrypts the connection but skips certificate chain verification.
 * - `DATABASE_RELAX_TLS=true` — use in **production** (e.g. Vercel) when the pooler shows
 *   “self-signed certificate in certificate chain” (Supabase, some Neon URLs, etc.).
 * - `DATABASE_SSL_REJECT_UNAUTHORIZED=false` or `0` — same effect (legacy name).
 * - Dev default: on when `NODE_ENV=development`, unless `DATABASE_SSL_REJECT_UNAUTHORIZED=true`.
 *
 * Supabase / pooler URLs often include sslmode=require; with node-pg that can still verify the
 * chain strictly. When relaxed, we strip those query params and set `rejectUnauthorized: false`.
 */
function relaxedPostgresTlsEnabled(): boolean {
  const relaxTls = process.env.DATABASE_RELAX_TLS;
  if (relaxTls === "1" || relaxTls?.toLowerCase() === "true") {
    return true;
  }

  const v = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  if (v === "0" || v?.toLowerCase() === "false") {
    return true;
  }
  if (v === "1" || v?.toLowerCase() === "true") {
    return false;
  }
  return process.env.NODE_ENV === "development";
}

function pgPoolConfig(): PgPoolArg {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  if (!relaxedPostgresTlsEnabled()) {
    return { connectionString } as PgPoolArg;
  }

  return {
    connectionString: stripSslQueryParams(connectionString),
    ssl: { rejectUnauthorized: false },
  } as PgPoolArg;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg(pgPoolConfig());

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
