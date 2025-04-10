import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not defined!");
  process.exit(1);
}

const client = postgres(DATABASE_URL);

export const db = drizzle(client, { schema });

export async function initializeDatabase() {
  try {
    console.log("Checking database connection...");
    // Perform a simple query to check connection
    await db.select().from(schema.users).limit(1);
    console.log("Database connection successful!");
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
}