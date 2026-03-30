import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use POSTGRES_URL (Supabase) with fallback to DATABASE_URL for compatibility
const getConnectionString = () => {
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      "Missing database connection string. Set POSTGRES_URL in your .env file."
    );
  }

  return connectionString;
};

// Lazy initialization - connection is only created when db is first accessed
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export const getDb = () => {
  if (!_db) {
    const connectionString = getConnectionString();
    // Disable prefetch as it is not supported for "Transaction" mode
    _client = postgres(connectionString, { prepare: false });
    _db = drizzle(_client, { schema });
  }
  return _db;
};

// Export a proxy for backwards compatibility
// This allows existing imports like `import { db } from ...` to continue working
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get: (_target, prop) => {
    const database = getDb();
    return Reflect.get(database, prop);
  },
});
