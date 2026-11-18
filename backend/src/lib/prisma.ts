import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import logger from "./logger";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// Neon suspends an idle database and its pooler closes sockets it still
// considers checked out. node-postgres will hand that dead socket to the next
// query, which then fails with "Server has closed the connection." Drop idle
// clients first, and wait long enough for a suspended database to wake.
const pool = new Pool({
  connectionString,
  max: 10,
  // Shorter than Neon's idle cutoff, so a checked-in client is closed here
  // before the pooler or a suspended compute drops it.
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 20_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  // An idle pool must not keep the process (or the test runner) alive.
  allowExitOnIdle: true,
});

const adapter = new PrismaPg(pool, {
  onPoolError: (err) => {
    logger.warn({ err }, "Postgres closed an idle connection");
  },
});

const base = new PrismaClient({
  adapter,
  // Prisma's defaults (maxWait 2s, timeout 5s) are tight for a serverless
  // Postgres reached through a connection pooler. Under load — or after a cold
  // start — acquiring a connection can exceed 2s, and $transaction then fails
  // with "Unable to start a transaction in the given time". That would surface
  // to a customer as "Failed to place order" at checkout, since both checkout
  // and cancellation do their work inside an interactive transaction.
  //
  // Observed directly against the Neon pooled endpoint while testing, so these
  // are raised rather than left at the defaults.
  transactionOptions: {
    maxWait: 10_000, // wait up to 10s for a free connection
    timeout: 15_000, // allow the transaction body up to 15s
  },
});

const errorText = (err: unknown): string => {
  if (err instanceof Error) {
    const cause = "cause" in err ? errorText(err.cause) : "";
    const code = "code" in err && err.code != null ? String(err.code) : "";
    return `${err.message}\n${code}\n${cause}`;
  }
  return String(err ?? "");
};

const connectionWasClosed = (err: unknown): boolean =>
  /server has closed the connection|connection terminated|ECONNRESET|EPIPE|ECONNREFUSED|08[0-9A-Z]{3}|57P01/i.test(
    errorText(err)
  );

const retryOnce = async <T, A>(query: (args: A) => Promise<T>, args: A): Promise<T> => {
  try {
    return await query(args);
  } catch (err) {
    if (!connectionWasClosed(err)) throw err;
    logger.warn({ err }, "Postgres closed the connection; retrying the query once");
    return query(args);
  }
};

// A dead socket is only discovered when a query uses it. One retry opens a
// fresh connection, which also wakes a suspended Neon database.
const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        return retryOnce(query, args);
      },
    },
  },
});

export default prisma;
