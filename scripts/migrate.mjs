// Runs drizzle migrations using the standalone bundle's traced dependencies,
// so the production image doesn't need the full node_modules tree.
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required to run migrations");
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations applied");
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  await client.end();
}
