import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const prisma = new PrismaClient({
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

export default prisma;
