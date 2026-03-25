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
 * - Explicit: DATABASE_SSL_REJECT_UNAUTHORIZED=false or 0
 * - Dev default: on when NODE_ENV=development, unless DATABASE_SSL_REJECT_UNAUTHORIZED=true or 1
 *
 * Supabase / pooler URLs often include sslmode=require; with current pg that is treated like
 * verify-full and can still fail with "self-signed certificate in certificate chain". We strip
 * those params and set rejectUnauthorized: false when relaxed.
 */
function relaxedPostgresTlsEnabled(): boolean {
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
